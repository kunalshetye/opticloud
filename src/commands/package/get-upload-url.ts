import {Command, Flags} from '@oclif/core'
import {packageService} from '../../lib/package-service.js'
import {formatError, logError, logSuccess, createSpinner, isValidGuid} from '../../lib/utils.js'

export default class PackageGetUploadUrl extends Command {
  static override summary = 'Get SAS URL for package upload (for testing)'

  static override description = `
Get a SAS URL for uploading packages to the storage container.
This is useful for testing or manual upload scenarios.
`

  static override examples = [
    '$ opti-dxp-cli package get-upload-url',
    '$ opti-dxp-cli package get-upload-url --project-id=12345678-1234-1234-1234-123456789012',
  ]

  static override flags = {
    'project-id': Flags.string({
      char: 'p',
      description: 'Project ID (GUID)',
      env: 'OPTI_PROJECT_ID',
    }),
    json: Flags.boolean({
      description: 'Output in JSON format',
      default: false,
    }),
  }

  public async run(): Promise<void> {
    const {flags} = await this.parse(PackageGetUploadUrl)

    // Validate project ID if provided
    if (flags['project-id'] && !isValidGuid(flags['project-id'])) {
      logError('Project ID must be a valid GUID')
      this.exit(1)
    }

    const spinner = createSpinner('Getting upload URL...')
    
    try {
      spinner.start()

      // We need to get the project ID first
      const projectId = flags['project-id'] || await (async () => {
        const {auth} = await import('../../lib/auth.js')
        const {config} = await import('../../lib/config.js')
        const credentials = await auth.getCredentials()
        return credentials?.projectId || config.getDefaultProjectId()
      })()

      if (!projectId) {
        throw new Error('Project ID is required. Provide via --project-id or set a default during login.')
      }

      const sasResponse = await packageService.getSasUrl(projectId)
      spinner.stop()

      if (flags.json) {
        this.log(JSON.stringify(sasResponse, null, 2))
        return
      }

      logSuccess('Upload URL retrieved successfully!')
      this.log(`SAS URL: ${sasResponse.sasUrl}`)
      this.log(`Container: ${sasResponse.containerName || 'deploymentpackages'}`)
      this.log('')
      this.log('You can use this URL to upload packages manually or with other tools.')
    } catch (error) {
      spinner.stop()
      logError(`Failed to get upload URL: ${formatError(error)}`)
      this.exit(1)
    }
  }
}