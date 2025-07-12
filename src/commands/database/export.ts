import {Command, Flags} from '@oclif/core'
import {apiClient} from '../../lib/api-client.js'
import {config} from '../../lib/config.js'
import {formatError, logError, logSuccess, createSpinner, validateEnvironment} from '../../lib/utils.js'

export default class DatabaseExport extends Command {
  static override summary = 'Start a database export'

  static override description = `
Start a database export from the specified environment.
The export will be saved to the storage container and can be downloaded later.
`

  static override examples = [
    '$ opti database export --environment=production',
    '$ opti database export --environment=integration --project-id=12345678-1234-1234-1234-123456789012',
  ]

  static override flags = {
    'project-id': Flags.string({
      char: 'p',
      description: 'Project ID (GUID)',
      env: 'OPTI_PROJECT_ID',
    }),
    environment: Flags.string({
      char: 'e',
      description: 'Environment to export from',
      options: ['integration', 'preproduction', 'production'],
      required: true,
    }),
    json: Flags.boolean({
      description: 'Output in JSON format',
      default: false,
    }),
  }

  public async run(): Promise<void> {
    const {flags} = await this.parse(DatabaseExport)

    // Validate environment
    if (!validateEnvironment(flags.environment)) {
      logError('Invalid environment. Must be: integration, preproduction, or production')
      this.exit(1)
    }

    const projectId = flags['project-id'] || config.getDefaultProjectId()
    if (!projectId) {
      logError('Project ID is required. Provide via --project-id or set a default.')
      this.exit(1)
    }

    const spinner = createSpinner('Starting database export...')
    spinner.start()

    try {
      // Placeholder for actual API call
      const exportResult = await apiClient.post(`projects/${projectId}/database-exports`, {
        environment: flags.environment,
      })

      spinner.stop()

      if (flags.json) {
        this.log(JSON.stringify(exportResult, null, 2))
        return
      }

      logSuccess('Database export started successfully!')
      this.log(`Environment: ${flags.environment}`)
      this.log('\nYou can check the export status with:')
      this.log('  opti database status')
    } catch (error) {
      spinner.stop()
      logError(`Failed to start database export: ${formatError(error)}`)
      this.exit(1)
    }
  }
}