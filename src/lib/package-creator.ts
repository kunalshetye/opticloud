import archiver from 'archiver'
import {createWriteStream, createReadStream, existsSync} from 'node:fs'
import {readdir, readFile} from 'node:fs/promises'
import {join} from 'node:path'
import ignore from 'ignore'

export interface PackageCreatorOptions {
  sourceDir: string
  packagePath: string
  useGitignore?: boolean
}

export class PackageCreator {
  /**
   * Create a highly compressed ZIP package from a directory
   */
  static async createPackage(options: PackageCreatorOptions): Promise<void> {
    const { sourceDir, packagePath, useGitignore = true } = options
    
    return new Promise(async (resolve, reject) => {
      const output = createWriteStream(packagePath)
      const archive = archiver('zip', {
        zlib: { 
          level: 9,        // Maximum compression (0-9)
          chunkSize: 1024, // 1KB chunks for better compression
          windowBits: 15,  // Maximum window size (8-15)
          memLevel: 8,     // Maximum memory usage for compression (1-9)
          strategy: 0,     // Default strategy (Z_DEFAULT_STRATEGY)
        },
        store: false,      // Always compress (don't store uncompressed)
        forceLocalTime: true, // Use local time for better compatibility
        comment: 'Created by opticloud CLI', // Add package metadata
      })

      // Handle completion and errors
      output.on('close', () => resolve())
      output.on('error', reject)
      archive.on('error', reject)
      archive.on('warning', (err) => {
        if (err.code === 'ENOENT') {
          // Log warnings but don't fail
          console.warn('Warning:', err.message)
        } else {
          reject(err)
        }
      })

      archive.pipe(output)

      try {
        // Load ignore patterns if requested
        const ignorePatterns = useGitignore 
          ? await PackageCreator.loadIgnorePatterns(sourceDir)
          : ignore()

        // Add files recursively with better compression
        await PackageCreator.addDirectoryToArchive(archive, sourceDir, '', ignorePatterns)
        
        // Finalize the archive
        await archive.finalize()
      } catch (error) {
        reject(error)
      }
    })
  }

  /**
   * Load .gitignore patterns plus common exclusions
   */
  private static async loadIgnorePatterns(directory: string): Promise<ReturnType<typeof ignore>> {
    const ig = ignore()
    
    // Always ignore common build/temp files and directories
    ig.add([
      '.DS_Store',
      'Thumbs.db',
      '*.tmp',
      '*.temp',
      '*.log',
      '.git/',
      '.svn/',
      '.hg/',
      '.bzr/',
      'node_modules/',
      '.npm/',
      '.yarn/',
      '.pnp.*',
      'coverage/',
      '.nyc_output/',
      'dist/',
      'build/',
      '*.tsbuildinfo',
      '.env',
      '.env.*',
      '!.env.example',
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

  /**
   * Recursively add directory contents to archive with compression optimization
   */
  private static async addDirectoryToArchive(
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
        await PackageCreator.addDirectoryToArchive(archive, sourceDir, entryRelativePath, ignorePatterns)
      } else if (entry.isFile()) {
        // Add file to archive with optimized settings
        const stream = createReadStream(entryFullPath)
        archive.append(stream, { 
          name: entryRelativePath,
          // Optimize compression based on file type
          store: PackageCreator.shouldStoreUncompressed(entry.name) ? true : false,
        })
      }
    }
  }

  /**
   * Determine if a file should be stored uncompressed
   * (already compressed files don't benefit from additional compression)
   */
  private static shouldStoreUncompressed(filename: string): boolean {
    const compressedExtensions = [
      '.zip', '.gz', '.bz2', '.7z', '.rar',
      '.jpg', '.jpeg', '.png', '.gif', '.webp',
      '.mp3', '.mp4', '.avi', '.mov', '.wmv',
      '.pdf', '.docx', '.xlsx', '.pptx',
    ]
    
    const ext = filename.toLowerCase()
    return compressedExtensions.some(compExt => ext.endsWith(compExt))
  }
}