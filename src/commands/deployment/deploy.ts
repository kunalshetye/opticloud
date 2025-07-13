import {Command, Flags, Args} from '@oclif/core'
import {resolve, join, basename} from 'node:path'
import {existsSync, statSync, unlinkSync} from 'node:fs'
import {tmpdir} from 'node:os'
import {randomBytes} from 'node:crypto'
import {auth} from '../../lib/auth.js'
import {config} from '../../lib/config.js'
import {apiClient} from '../../lib/api-client.js'
import {packageService} from '../../lib/package-service.js'
import {deploymentService} from '../../lib/deployment-service.js'
import {
  formatError,
  logError,
  logSuccess,
  logInfo,
  logWarning,
  isValidGuid,
  createSpinner,
  formatDeploymentStatus,
} from '../../lib/utils.js'
import {AuthCredentials} from '../../lib/types.js'

type PackageType = 'cms' | 'head' | 'commerce' | 'sqldb'

export default class DeploymentDeploy extends Command {
  static override summary = 'Deploy application in one command (create package, upload, deploy, and complete)'

  static override description = `
Deploy an application to Optimizely DXP Cloud in a single command.
This orchestrates the complete deployment workflow:

1. Create package from directory
2. Upload package to DXP Cloud storage  
3. Start deployment with watching
4. Complete deployment when ready

The command supports credential override for deploying to different servers or environments
without permanently changing stored credentials.
`

  static override examples = [
    '$ opticloud deployment:deploy ../optimizely-one --target=Test1 --type=head --version=20250712 --prefix=optimizely-one',
    '$ opticloud deployment:deploy ./my-app --target=integration --type=cms --client-key=KEY --client-secret=SECRET',
    '$ opticloud deployment:deploy ./my-app --target=production --type=head --api-endpoint=https://custom.dxp.com/api/v1.0/',
    '$ opticloud deployment:deploy ./my-app --target=preproduction --type=commerce --skip-validation',
  ]

  static override args = {
    directory: Args.string({
      name: 'directory',
      required: true,
      description: 'Directory to package and deploy',
    }),
  }

  static override flags = {
    target: Flags.string({
      char: 't',
      description: 'Target environment',
      required: true,
    }),
    type: Flags.string({
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
      description: 'Output directory for package (defaults to temp directory)',
    }),
    'project-id': Flags.string({
      description: 'Project ID (GUID)',
      env: 'OPTI_PROJECT_ID',
    }),
    'client-key': Flags.string({
      description: 'DXP Cloud client key (overrides stored credentials)',
      env: 'OPTI_CLIENT_KEY',
    }),
    'client-secret': Flags.string({
      description: 'DXP Cloud client secret (overrides stored credentials)',
      env: 'OPTI_CLIENT_SECRET',
    }),
    'api-endpoint': Flags.string({
      description: 'API endpoint URL (overrides stored config)',
      env: 'OPTI_API_ENDPOINT',
    }),
    'skip-validation': Flags.boolean({
      description: 'Skip credential validation',
      default: false,
    }),
    'db-type': Flags.string({
      description: 'Database type for sqldb packages (cms or commerce)',
      options: ['cms', 'commerce'],
      default: 'cms',
      dependsOn: ['type'],
    }),
    'poll-interval': Flags.integer({
      description: 'Polling interval in seconds for deployment watching',
      default: 10,
      min: 5,
      max: 300,
    }),
    'continue-on-errors': Flags.boolean({
      description: 'Continue watching even when errors are detected',
      default: false,
    }),
    json: Flags.boolean({
      description: 'Output in JSON format',
      default: false,
    }),
  }

  private originalCredentials: AuthCredentials | null = null
  private originalApiEndpoint: string | null = null
  private tempPackagePath: string | null = null

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(DeploymentDeploy)

    try {
      // Setup authentication and configuration overrides
      await this.setupCredentials(flags)

      // Validate directory exists
      const sourceDir = resolve(args.directory)
      if (!existsSync(sourceDir)) {
        logError(`Directory not found: ${sourceDir}`)
        this.exit(1)
      }

      if (!statSync(sourceDir).isDirectory()) {
        logError(`Path is not a directory: ${sourceDir}`)
        this.exit(1)
      }

      // Validate project ID if provided
      if (flags['project-id'] && !isValidGuid(flags['project-id'])) {
        logError('Project ID must be a valid GUID')
        this.exit(1)
      }

      if (!flags.json) {
        logInfo('🚀 Starting complete deployment workflow...')
        this.log('')
      }

      // Step 1: Create package
      const packagePath = await this.createPackage(sourceDir, flags)
      this.tempPackagePath = packagePath

      // Step 2: Upload package
      await this.uploadPackage(packagePath, flags)

      // Step 3: Start deployment
      const deployment = await this.startDeployment(packagePath, flags)

      // Step 4: Watch and complete deployment
      await this.watchAndCompleteDeployment(deployment.id, flags)

      if (flags.json) {
        this.log(JSON.stringify({
          success: true,
          deploymentId: deployment.id,
          packagePath: basename(packagePath),
        }, null, 2))
      } else {
        logSuccess('✅ Deployment workflow completed successfully!')
      }

    } catch (error) {
      logError(`Deployment failed: ${formatError(error)}`)
      this.exit(1)
    } finally {
      await this.cleanup()
    }
  }

  private async setupCredentials(flags: any): Promise<void> {
    // Store original state for restoration
    this.originalCredentials = await auth.getCredentials()
    this.originalApiEndpoint = config.getApiEndpoint()

    // Override API endpoint if provided
    if (flags['api-endpoint']) {
      config.setApiEndpoint(flags['api-endpoint'])
    }

    // Override credentials if provided
    if (flags['client-key'] || flags['client-secret']) {
      if (!flags['client-key'] || !flags['client-secret']) {
        throw new Error('Both --client-key and --client-secret must be provided together')
      }

      const overrideCredentials: AuthCredentials = {
        clientKey: flags['client-key'],
        clientSecret: flags['client-secret'],
        projectId: flags['project-id'] || this.originalCredentials?.projectId,
      }

      // Validate override credentials if not skipping validation
      if (!flags['skip-validation']) {
        const spinner = createSpinner('Validating credentials...')
        spinner.start()
        
        try {
          const validation = await apiClient.validateCredentials(overrideCredentials)
          if (!validation.valid) {
            throw new Error('Invalid credentials provided')
          }
          spinner.stop()
        } catch (error) {
          spinner.stop()
          throw new Error(`Credential validation failed: ${formatError(error)}`)
        }
      }

      // Set the override credentials
      apiClient.setCredentials(overrideCredentials)
    } else {
      // Use stored credentials but validate they exist
      if (!this.originalCredentials) {
        throw new Error('No authentication credentials found. Provide --client-key and --client-secret or run "opti auth login" first.')
      }
    }
  }

  private async createPackage(sourceDir: string, flags: any): Promise<string> {
    const spinner = createSpinner('Creating package...')
    spinner.start()

    try {
      // Determine output directory (temp if not specified)
      const outputDir = flags.output ? resolve(flags.output) : tmpdir()
      
      // Generate package info
      const packageInfo = this.generatePackageInfo(
        flags.type as PackageType,
        flags.version,
        flags.prefix,
        flags['db-type']
      )
      
      const packagePath = join(outputDir, packageInfo.name)

      // Check if package already exists
      if (existsSync(packagePath)) {
        logWarning(`Removing existing package: ${packagePath}`)
        unlinkSync(packagePath)
      }

      // Use the package creation logic (simplified version of PackageCreate)
      await this.createPackageFile(sourceDir, packagePath)

      spinner.stop()
      
      if (!flags.json) {
        logSuccess(`📦 Package created: ${packageInfo.name}`)
      }

      return packagePath
    } catch (error) {
      spinner.stop()
      throw new Error(`Package creation failed: ${formatError(error)}`)
    }
  }

  private generatePackageInfo(type: PackageType, version?: string, prefix?: string, dbType = 'cms'): {name: string} {
    const packageVersion = version || new Date().toISOString().slice(0, 10).replace(/-/g, '')
    
    let name: string

    switch (type) {
      case 'cms': {
        name = prefix ? `${prefix}.cms.app.${packageVersion}.nupkg` : `cms.app.${packageVersion}.nupkg`
        break
      }
      case 'commerce': {
        name = prefix ? `${prefix}.commerce.app.${packageVersion}.nupkg` : `commerce.app.${packageVersion}.nupkg`
        break
      }
      case 'head': {
        name = prefix ? `${prefix}.head.app.${packageVersion}.zip` : `head.app.${packageVersion}.zip`
        break
      }
      case 'sqldb': {
        name = prefix ? `${prefix}.${dbType}.sqldb.${packageVersion}.bacpac` : `${dbType}.sqldb.${packageVersion}.bacpac`
        break
      }
      default: {
        throw new Error(`Unsupported package type: ${type}`)
      }
    }

    return {name}
  }

  private async createPackageFile(sourceDir: string, packagePath: string): Promise<void> {
    // This is a simplified implementation - in a real scenario you'd want to
    // import and reuse the full logic from PackageCreate command
    const archiver = await import('archiver')
    const {createWriteStream} = await import('node:fs')
    const {readdir} = await import('node:fs/promises')
    
    return new Promise((resolve, reject) => {
      const output = createWriteStream(packagePath)
      const archive = archiver.default('zip', {
        zlib: { level: 9 },
      })

      output.on('close', () => resolve())
      archive.on('error', reject)

      archive.pipe(output)
      archive.directory(sourceDir, false)
      archive.finalize()
    })
  }

  private async uploadPackage(packagePath: string, flags: any): Promise<void> {
    const spinner = createSpinner('Uploading package...')
    spinner.start()

    try {
      await packageService.uploadPackage({
        filePath: packagePath,
        projectId: flags['project-id'],
      })

      spinner.stop()
      
      if (!flags.json) {
        logSuccess(`📤 Package uploaded: ${basename(packagePath)}`)
      }
    } catch (error) {
      spinner.stop()
      throw new Error(`Package upload failed: ${formatError(error)}`)
    }
  }

  private async startDeployment(packagePath: string, flags: any): Promise<any> {
    const spinner = createSpinner('Starting deployment...')
    spinner.start()

    try {
      const deployment = await deploymentService.startDeployment({
        projectId: flags['project-id']!,
        targetEnvironment: flags.target,
        deploymentPackages: [basename(packagePath)],
      })

      spinner.stop()
      
      if (!flags.json) {
        logSuccess(`🚀 Deployment started: ${deployment.id}`)
        logInfo(`Target: ${flags.target}`)
        this.log('')
      }

      return deployment
    } catch (error) {
      spinner.stop()
      throw new Error(`Deployment start failed: ${formatError(error)}`)
    }
  }

  private async watchAndCompleteDeployment(deploymentId: string, flags: any): Promise<void> {
    if (!flags.json) {
      logInfo('👀 Watching deployment progress...')
      this.log(`📊 Polling every ${flags['poll-interval']} seconds`)
      this.log('')
    }

    let lastStatus = ''
    let lastProgress = -1
    let consecutiveErrors = 0
    const maxErrors = 3

    while (true) {
      try {
        const deployments = await deploymentService.listDeployments({
          projectId: flags['project-id'] || '',
          id: deploymentId,
        })

        if (deployments.length === 0) {
          throw new Error('Deployment not found')
        }

        const deployment = deployments[0]
        const currentStatus = deployment.status
        const currentProgress = deployment.percentComplete || 0

        // Status changed
        if (currentStatus !== lastStatus && !flags.json) {
          const timestamp = new Date().toLocaleTimeString()
          this.log(`[${timestamp}] Status: ${lastStatus} → ${formatDeploymentStatus(currentStatus)}`)
          lastStatus = currentStatus
        }

        // Progress changed
        if (currentProgress !== lastProgress && currentProgress > lastProgress && !flags.json) {
          const timestamp = new Date().toLocaleTimeString()
          this.log(`[${timestamp}] Progress: ${currentProgress}%`)
          lastProgress = currentProgress
        }

        // Handle errors
        const errorCount = deployment.deploymentErrors?.length || 0
        if (errorCount > 0 && !flags.json && !flags['continue-on-errors']) {
          logError('Errors detected during deployment')
          deployment.deploymentErrors?.forEach((error, index) => {
            this.log(`${index + 1}. ${error}`)
          })
          throw new Error('Deployment failed with errors')
        }

        // Check if deployment needs completion
        if (currentStatus.toLowerCase() === 'awaitingverification') {
          if (!flags.json) {
            logInfo('🔄 Deployment awaiting verification, completing...')
          }
          
          await deploymentService.completeDeployment(flags['project-id']!, deploymentId)
          
          if (!flags.json) {
            logSuccess('✅ Deployment completed!')
          }
          break
        } else if (currentStatus.toLowerCase() === 'succeeded') {
          if (!flags.json) {
            logSuccess(`✅ Deployment succeeded! (${currentProgress}%)`)
          }
          break
        } else if (currentStatus.toLowerCase() === 'failed') {
          throw new Error('Deployment failed')
        }

        consecutiveErrors = 0
      } catch (error) {
        consecutiveErrors++
        if (consecutiveErrors >= maxErrors) {
          throw new Error(`Too many consecutive errors: ${formatError(error)}`)
        }
        
        if (!flags.json) {
          logWarning(`Polling error (${consecutiveErrors}/${maxErrors}): ${formatError(error)}`)
        }
      }

      // Wait before next poll
      await new Promise(resolve => setTimeout(resolve, flags['poll-interval'] * 1000))
    }
  }

  private async cleanup(): Promise<void> {
    try {
      // Restore original credentials and config
      if (this.originalCredentials) {
        apiClient.setCredentials(this.originalCredentials)
      }
      
      if (this.originalApiEndpoint) {
        config.setApiEndpoint(this.originalApiEndpoint)
      }

      // Clean up temporary package file if it exists and is in temp directory
      if (this.tempPackagePath && this.tempPackagePath.includes(tmpdir()) && existsSync(this.tempPackagePath)) {
        try {
          unlinkSync(this.tempPackagePath)
        } catch {
          // Ignore cleanup errors
        }
      }
    } catch {
      // Ignore cleanup errors
    }
  }
}