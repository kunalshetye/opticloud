import {Command} from '@oclif/core'
import {apiClient} from '../../lib/api-client.js'
import {auth} from '../../lib/auth.js'
import {formatError, logError, logSuccess, createSpinner} from '../../lib/utils.js'

export default class AuthTest extends Command {
  static override summary = 'Test authentication by making an API call'

  static override description = `
Test the stored credentials by making a simple API call to the DXP Cloud.
This verifies that your credentials are valid and the API is accessible.
`

  static override examples = ['$ opti-dxp-cli auth test']

  public async run(): Promise<void> {
    const credentials = await auth.getCredentials()
    if (!credentials) {
      logError('No credentials found. Please run "opti-dxp-cli auth:login" first.')
      this.exit(1)
    }

    const spinner = createSpinner('Testing API connection...')
    spinner.start()

    try {
      // Use the same validation method as login
      const validation = await apiClient.validateCredentials(credentials)
      spinner.stop()

      if (validation.valid) {
        logSuccess('Authentication test successful!')
        this.log('API is accessible and credentials are valid.')
        
        if (credentials.projectId && validation.projectsFound !== undefined) {
          this.log(`\\nFound ${validation.projectsFound} deployment(s) in project ${credentials.projectId}.`)
        } else if (validation.projectsFound !== undefined) {
          this.log(`\\nAccess to ${validation.projectsFound} project(s) confirmed.`)
        }
      } else {
        logError('Authentication test failed - credentials are invalid.')
        this.log('\\nPlease run "opti-dxp-cli auth:login" with fresh credentials.')
        this.exit(1)
      }
    } catch (error) {
      spinner.stop()
      
      if (error instanceof Error && error.message.includes('No authentication credentials found')) {
        logError('No credentials found. Please run "opti-dxp-cli auth:login" first.')
      } else if (error instanceof Error && error.message.includes('403')) {
        logError('Access denied (403 Forbidden)')
        this.log('\\nThis typically means:')
        this.log('- Your credentials are invalid or expired')
        this.log('- Your account lacks necessary permissions')
        this.log('\\nPlease run "opti-dxp-cli auth:login" with fresh credentials.')
      } else if (error instanceof Error && error.message.includes('401')) {
        logError('Authentication failed (401 Unauthorized)')
        this.log('\nYour credentials are invalid. Please run "opti-dxp-cli auth:login" with correct credentials.')
      } else {
        logError(`Authentication test failed: ${formatError(error)}`)
        this.log('\\nThis could indicate:')
        this.log('- Network connectivity issues')
        this.log('- API endpoint problems')
        this.log('- Server-side issues')
      }
      
      this.exit(1)
    }
  }
}