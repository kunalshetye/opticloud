import {Command, Flags, Args} from '@oclif/core'
import {resolve, join, basename, dirname} from 'node:path'
import {existsSync, statSync, createReadStream} from 'node:fs'
import {readdir, readFile} from 'node:fs/promises'
import archiver from 'archiver'
import {createWriteStream} from 'node:fs'
import ignore from 'ignore'
import {formatError, logError, logSuccess, createSpinner} from '../../lib/utils.js'

type PackageType = 'cms' | 'head' | 'commerce' | 'sqldb'

interface PackageInfo {
  name: string
  extension: string
  type: string
}

export default class PackageCreate extends Command {
  static override summary = 'Create a deployment package from a directory'

  static override description = `
Create a deployment package from a directory, respecting .gitignore patterns.
The command packages the contents of the directory (not the directory itself) into a zip file 
with the appropriate DXP naming convention and file extension.

Package Types:
- cms: Creates [prefix.]cms.app.<version>.nupkg
- commerce: Creates [prefix.]commerce.app.<version>.nupkg  
- head: Creates [prefix.]head.app.<version>.zip
- sqldb: Creates [prefix.]cms.sqldb.<version>.bacpac or [prefix.]commerce.sqldb.<version>.bacpac

The created package respects .gitignore files in the source directory.
`

  static override examples = [
    '$ opti-dxp-cli package:create ./my-cms-app --type=cms',
    '$ opti-dxp-cli package:create ./my-head-app --type=head --version=2.1.0 --prefix=optimizely-one',
    '$ opti-dxp-cli package:create ./my-commerce-app --type=commerce --output=./dist',
    '$ opti-dxp-cli package:create ./database --type=sqldb --version=1.0.0',
    '$ opti-dxp-cli package:create ./my-app --type=cms --prefix=mysite --output=./packages',
  ]

  static override args = {
    directory: Args.string({
      name: 'directory',
      required: true,
      description: 'Directory to package',
    }),
  }

  static override flags = {
    type: Flags.string({
      char: 't',
      description: 'Package type',
      required: true,
      options: ['cms', 'head', 'commerce', 'sqldb'],
    }),
    version: Flags.string({
      char: 'v',
      description: 'Package version (defaults to current timestamp)',
    }),
    prefix: Flags.string({
      char: 'p',
      description: 'Package name prefix',
    }),
    output: Flags.string({
      char: 'o',
      description: 'Output directory (defaults to current directory)',
      default: '.',
    }),
    'db-type': Flags.string({
      description: 'Database type for sqldb packages (cms or commerce)',
      options: ['cms', 'commerce'],
      default: 'cms',
      dependsOn: ['type'],
    }),
    json: Flags.boolean({
      description: 'Output in JSON format',
      default: false,
    }),
  }

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(PackageCreate)

    const {
      directory,
    } = args

    const {
      type,
      version,
      prefix,
      output,
      'db-type': dbType,
    } = flags

    // Validate directory exists
    const sourceDir = resolve(directory)
    if (!existsSync(sourceDir)) {
      logError(`Directory not found: ${sourceDir}`)
      this.exit(1)
    }

    if (!statSync(sourceDir).isDirectory()) {
      logError(`Path is not a directory: ${sourceDir}`)
      this.exit(1)
    }

    // Validate output directory
    const outputDir = resolve(output)
    if (!existsSync(outputDir)) {
      logError(`Output directory not found: ${outputDir}`)
      this.exit(1)
    }

    try {
      // Generate package info
      const packageInfo = this.generatePackageInfo(type as PackageType, version, prefix, dbType)
      const packagePath = join(outputDir, packageInfo.name)

      // Check if package already exists
      if (existsSync(packagePath)) {
        logError(`Package already exists: ${packagePath}`)
        this.exit(1)
      }

      const spinner = createSpinner(`Creating ${packageInfo.type} package...`)
      spinner.start()

      // Load .gitignore patterns
      const ignorePatterns = await this.loadIgnorePatterns(sourceDir)

      // Create package
      await this.createPackage(sourceDir, packagePath, ignorePatterns)

      spinner.stop()

      if (flags.json) {
        this.log(JSON.stringify({
          success: true,
          packagePath,
          packageName: packageInfo.name,
          type: packageInfo.type,
          size: statSync(packagePath).size,
        }, null, 2))
      } else {
        logSuccess(`Package created successfully!`)
        this.log('')
        this.log(`Package: ${packageInfo.name}`)
        this.log(`Type: ${packageInfo.type}`)
        this.log(`Location: ${packagePath}`)
        this.log(`Size: ${this.formatFileSize(statSync(packagePath).size)}`)
      }

    } catch (error) {
      logError(`Failed to create package: ${formatError(error)}`)
      this.exit(1)
    }
  }

  private generatePackageInfo(type: PackageType, version?: string, prefix?: string, dbType = 'cms'): PackageInfo {
    const packageVersion = version || new Date().toISOString().slice(0, 10).replace(/-/g, '')
    
    let name: string
    let extension: string
    let packageType: string

    switch (type) {
      case 'cms': {
        name = prefix ? `${prefix}.cms.app.${packageVersion}.nupkg` : `cms.app.${packageVersion}.nupkg`
        extension = '.nupkg'
        packageType = 'CMS Application'
        break
      }
      case 'commerce': {
        name = prefix ? `${prefix}.commerce.app.${packageVersion}.nupkg` : `commerce.app.${packageVersion}.nupkg`
        extension = '.nupkg'
        packageType = 'Commerce Application'
        break
      }
      case 'head': {
        name = prefix ? `${prefix}.head.app.${packageVersion}.zip` : `head.app.${packageVersion}.zip`
        extension = '.zip'
        packageType = 'Head Application'
        break
      }
      case 'sqldb': {
        name = prefix ? `${prefix}.${dbType}.sqldb.${packageVersion}.bacpac` : `${dbType}.sqldb.${packageVersion}.bacpac`
        extension = '.bacpac'
        packageType = `${dbType.toUpperCase()} Database`
        break
      }
      default: {
        throw new Error(`Unsupported package type: ${type}`)
      }
    }

    return {
      name,
      extension,
      type: packageType,
    }
  }

  private async loadIgnorePatterns(directory: string): Promise<ReturnType<typeof ignore>> {
    const ig = ignore()
    
    // Always ignore common build/temp files
    ig.add([
      '.DS_Store',
      'Thumbs.db',
      '*.tmp',
      '*.temp',
      '.git/',
      '.svn/',
      '.hg/',
      'node_modules/',
      '.npm/',
      '.yarn/',
    ])

    try {
      const gitignorePath = join(directory, '.gitignore')
      if (existsSync(gitignorePath)) {
        const gitignoreContent = await readFile(gitignorePath, 'utf8')
        ig.add(gitignoreContent)
      }
    } catch (error) {
      // Ignore errors reading .gitignore - it's optional
    }

    return ig
  }

  private async createPackage(sourceDir: string, packagePath: string, ignorePatterns: ReturnType<typeof ignore>): Promise<void> {
    return new Promise((resolve, reject) => {
      const output = createWriteStream(packagePath)
      const archive = archiver('zip', {
        zlib: { level: 9 }, // Maximum compression
      })

      output.on('close', () => {
        resolve()
      })

      archive.on('error', (error) => {
        reject(error)
      })

      archive.pipe(output)

      // Add files recursively
      this.addDirectoryToArchive(archive, sourceDir, '', ignorePatterns)
        .then(() => {
          archive.finalize()
        })
        .catch(reject)
    })
  }

  private async addDirectoryToArchive(
    archive: archiver.Archiver,
    sourceDir: string,
    relativePath: string,
    ignorePatterns: ReturnType<typeof ignore>
  ): Promise<void> {
    const fullPath = join(sourceDir, relativePath)
    const entries = await readdir(fullPath, { withFileTypes: true })

    for (const entry of entries) {
      const entryRelativePath = relativePath ? join(relativePath, entry.name) : entry.name
      const entryFullPath = join(fullPath, entry.name)

      // Check if this path should be ignored
      if (ignorePatterns.ignores(entryRelativePath)) {
        continue
      }

      if (entry.isDirectory()) {
        // Recursively add directory contents
        await this.addDirectoryToArchive(archive, sourceDir, entryRelativePath, ignorePatterns)
      } else if (entry.isFile()) {
        // Add file to archive
        const stream = createReadStream(entryFullPath)
        archive.append(stream, { name: entryRelativePath })
      }
    }
  }

  private formatFileSize(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB']
    let size = bytes
    let unitIndex = 0

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024
      unitIndex++
    }

    return `${size.toFixed(1)} ${units[unitIndex]}`
  }
}