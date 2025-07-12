import {Command} from '@oclif/core'
import {auth} from '../../lib/auth.js'
import {logError, logSuccess} from '../../lib/utils.js'

export default class AuthLogout extends Command {
  static override summary = 'Remove stored authentication credentials'

  static override description = `
Remove stored authentication credentials from your system's credential store.
This will require you to login again before using other commands.
`

  static override examples = ['$ opti-dxp-cli auth logout']

  public async run(): Promise<void> {
    try {
      if (!(await auth.hasCredentials())) {
        this.log('No credentials found to remove.')
        return
      }

      await auth.clearCredentials()
      logSuccess('Logged out successfully. Credentials removed.')
    } catch (error) {
      logError(`Failed to remove credentials: ${error}`)
      this.exit(1)
    }
  }
}