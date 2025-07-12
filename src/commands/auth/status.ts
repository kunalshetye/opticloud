import {Command, Flags} from '@oclif/core'
import {auth} from '../../lib/auth.js'
import {config} from '../../lib/config.js'
import {apiClient} from '../../lib/api-client.js'
import {createSpinner, logWarning, formatError} from '../../lib/utils.js'

export default class AuthStatus extends Command {
  static override summary = 'Show current authentication status'

  static override description = `
Display information about current authentication status and configuration.
Shows masked credentials, current API endpoint settings, and validates credentials.
`

  static override examples = [
    '$ opti-dxp-cli auth status',
    '$ opti-dxp-cli auth status --skip-validation',
  ]

  static override flags = {
    'skip-validation': Flags.boolean({
      description: 'Skip credential validation check',
      default: false,
    }),
  }

  public async run(): Promise<void> {
    const {flags} = await this.parse(AuthStatus)
    const hasCredentials = await auth.hasCredentials()

    if (!hasCredentials) {
      this.log('Not authenticated. Run "opti-dxp-cli auth:login" to authenticate.')
      return
    }

    const credentials = await auth.getCredentials()
    const configData = config.getAll()

    this.log('Authentication Status: ✓ Authenticated')
    this.log('')
    this.log('Credentials (stored in keychain):')
    this.log(`  Client Key: ${credentials?.clientKey?.slice(0, 8)}...`)
    this.log(`  Project ID: ${credentials?.projectId || 'Not set'}`)
    this.log('')
    this.log('Configuration (stored in ~/.config/opti-dxp-cli/config.json):')
    this.log(`  API Endpoint: ${configData.apiEndpoint}`)
    this.log(`  Default Project ID: ${configData.defaultProjectId || 'Not set'}`)
    this.log('')
    
    // Show which project ID takes precedence
    const effectiveProjectId = credentials?.projectId || configData.defaultProjectId
    if (effectiveProjectId) {
      this.log(`Effective Project ID: ${effectiveProjectId} ${credentials?.projectId ? '(from credentials)' : '(from config)'}`)
    } else {
      this.log('No default project ID configured. Set one with --project-id during login.')
    }

    // Validate credentials unless skipped
    if (!flags['skip-validation'] && credentials) {
      this.log('')
      const spinner = createSpinner('Validating credentials...')
      spinner.start()

      try {
        const validation = await apiClient.validateCredentials(credentials)
        spinner.stop()

        if (validation.valid) {
          this.log('Credential Status: ✓ Valid and working')
          if (effectiveProjectId && validation.projectsFound !== undefined) {
            this.log(`  Found ${validation.projectsFound} deployment(s) in project ${effectiveProjectId}`)
          } else if (validation.projectsFound !== undefined) {
            this.log(`  Access to ${validation.projectsFound} project(s) confirmed`)
          }
        } else {
          this.log('Credential Status: ✗ Invalid or expired')
          this.log('  Run "opti-dxp-cli auth:login" to refresh your credentials')
        }
      } catch (error) {
        spinner.stop()
        logWarning(`Could not validate credentials: ${formatError(error)}`)
        this.log('Credential Status: ? Unable to verify (network/API issue)')
        this.log('  Your credentials may still be valid')
      }
    } else if (flags['skip-validation']) {
      this.log('')
      this.log('Credential Status: ? Validation skipped')
    }
  }
}