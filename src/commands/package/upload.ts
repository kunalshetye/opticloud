import {Command, Flags, Args} from '@oclif/core'
import {resolve, basename} from 'node:path'
import {packageService} from '../../lib/package-service.js'
import {formatError, logError, logSuccess, createSpinner, isValidGuid} from '../../lib/utils.js'

export default class PackageUpload extends Command {
  static override summary = 'Upload a deployment package'

  static override description = `
Upload a deployment package to the DXP Cloud storage container.

The package file must be a valid package for CMS/Commerce applications:
- CMS/Commerce apps: [prefix.]cms|commerce|head.app.<version>.nupkg|zip
- Database: [prefix.]cms|commerce.sqldb.<version>.bacpac

The file will be uploaded to Azure Storage using a secure SAS URL.
`

  static override examples = [
    '$ opticloud package upload ./site.cms.app.1.0.0.nupkg',
    '$ opticloud package upload ./optimizely-one.head.app.20250610.zip',
    '$ opticloud package upload ./package.zip --project-id=12345678-1234-1234-1234-123456789012',
    '$ opticloud package upload ./package.zip --blob-name=custom-name.zip',
    '$ opticloud package upload ./package.zip --container=mysitemedia',
    '$ opticloud package upload ./package.zip --container=deploymentpackages --environment=Preproduction',
  ]

  static override args = {
    packagePath: Args.string({
      name: 'packagePath',
      required: true,
      description: 'Path to the deployment package file',
    }),
  }

  static override flags = {
    'project-id': Flags.string({
      char: 'p',
      description: 'Project ID (GUID)',
      env: 'OPTI_PROJECT_ID',
    }),
    'blob-name': Flags.string({
      char: 'b',
      description: 'Custom blob name in storage (defaults to filename)',
    }),
    'container': Flags.string({
      char: 'c',
      description: 'Storage container name (e.g., mysitemedia, deploymentpackages)',
    }),
    'environment': Flags.string({
      char: 'e',
      description: 'Environment name (Integration, Preproduction, Production)',
      default: 'Integration',
    }),
    json: Flags.boolean({
      description: 'Output in JSON format',
      default: false,
    }),
  }

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(PackageUpload)

    // Validate project ID if provided
    if (flags['project-id'] && !isValidGuid(flags['project-id'])) {
      logError('Project ID must be a valid GUID')
      this.exit(1)
    }

    // Resolve the file path to absolute path
    const filePath = resolve(args.packagePath)

    const spinner = createSpinner('Uploading package...')
    
    try {
      spinner.start()
      spinner.text = 'Validating package...'

      await packageService.uploadPackage({
        filePath,
        projectId: flags['project-id'],
        blobName: flags['blob-name'],
        containerName: flags['container'],
        environment: flags['environment'],
      })

      spinner.stop()

      if (flags.json) {
        this.log(JSON.stringify({
          success: true,
          filePath: args.packagePath,
          blobName: flags['blob-name'] || basename(filePath),
        }, null, 2))
        return
      }

      logSuccess('Package uploaded successfully!')
      this.log(`File: ${args.packagePath}`)
      this.log(`Blob name: ${flags['blob-name'] || basename(filePath)}`)
      this.log('')
      this.log('You can now use this package in deployments with:')
      this.log(`  opti deployment start --target=<environment> --packages="${flags['blob-name'] || basename(filePath)}"`)
    } catch (error) {
      spinner.stop()
      console.error('Raw error:', error)
      logError(`Failed to upload package: ${formatError(error)}`)
      this.exit(1)
    }
  }
}