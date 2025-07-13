import {Command, Flags} from '@oclif/core'
import inquirer from 'inquirer'
import {auth} from '../../lib/auth.js'
import {config} from '../../lib/config.js'
import {apiClient} from '../../lib/api-client.js'
import {logError, logSuccess, isValidGuid, createSpinner, logWarning} from '../../lib/utils.js'

export default class AuthLogin extends Command {
  static override summary = 'Authenticate with Optimizely DXP Cloud'

  static override description = `
Store authentication credentials securely for Optimizely DXP Cloud API access.

The client key and secret can be obtained from the Optimizely DXP Cloud portal.
Credentials are stored securely in your system's credential store.

The command validates credentials by making a test API call before saving them.
Use --skip-validation to bypass this check for testing or offline scenarios.
`

  static override examples = [
    '$ opticloud auth:login',
    '$ opticloud auth:login --client-key=YOUR_KEY --client-secret=YOUR_SECRET',
    '$ opticloud auth:login --project-id=12345678-1234-1234-1234-123456789012',
    '$ opticloud auth:login --skip-validation',
  ]

  static override flags = {
    'client-key': Flags.string({
      char: 'k',
      description: 'DXP Cloud client key',
      env: 'OPTI_CLIENT_KEY',
    }),
    'client-secret': Flags.string({
      char: 's',
      description: 'DXP Cloud client secret',
      env: 'OPTI_CLIENT_SECRET',
    }),
    'project-id': Flags.string({
      char: 'p',
      description: 'Default project ID (GUID)',
      env: 'OPTI_PROJECT_ID',
    }),
    'api-endpoint': Flags.string({
      char: 'e',
      description: 'API endpoint URL',
      default: 'https://paasportal.episerver.net/api/v1.0/',
      env: 'OPTI_API_ENDPOINT',
    }),
    force: Flags.boolean({
      char: 'f',
      description: 'Force login even if already authenticated',
      default: false,
    }),
    'skip-validation': Flags.boolean({
      description: 'Skip credential validation (for testing/offline use)',
      default: false,
    }),
  }

  public async run(): Promise<void> {
    const {flags} = await this.parse(AuthLogin)

    // Check if already authenticated
    if (!flags.force && (await auth.hasCredentials())) {
      const credentials = await auth.getCredentials()
      this.log('Already authenticated with client key:', credentials?.clientKey?.slice(0, 8) + '...')
      this.log('Use --force to overwrite existing credentials')
      return
    }

    let {
      'client-key': clientKey,
      'client-secret': clientSecret,
      'project-id': projectId,
      'api-endpoint': apiEndpoint,
    } = flags

    // Interactive prompts if values not provided
    if (!clientKey || !clientSecret) {
      this.log('Enter your Optimizely DXP Cloud credentials:')
      this.log('(You can find these in the DXP Cloud portal under API credentials)')

      const answers = await inquirer.prompt([
        {
          type: 'input',
          name: 'clientKey',
          message: 'Client Key:',
          when: () => !clientKey,
          validate: (input) => {
            if (!input.trim()) return 'Client key is required'
            if (input.length < 10) return 'Client key seems too short'
            return true
          },
        },
        {
          type: 'password',
          name: 'clientSecret',
          message: 'Client Secret:',
          when: () => !clientSecret,
          validate: (input) => {
            if (!input.trim()) return 'Client secret is required'
            if (input.length < 10) return 'Client secret seems too short'
            return true
          },
        },
        {
          type: 'input',
          name: 'projectId',
          message: 'Default Project ID (optional):',
          when: () => !projectId,
          validate: (input) => {
            if (!input.trim()) return true // Optional
            if (!isValidGuid(input)) return 'Project ID must be a valid GUID'
            return true
          },
        },
      ])

      clientKey = clientKey || answers.clientKey
      clientSecret = clientSecret || answers.clientSecret
      projectId = projectId || answers.projectId || undefined
    }

    // Validate required fields
    if (!clientKey || !clientSecret) {
      logError('Client key and secret are required')
      this.exit(1)
    }

    // Validate project ID if provided
    if (projectId && !isValidGuid(projectId)) {
      logError('Project ID must be a valid GUID')
      this.exit(1)
    }

    try {
      // Validate credentials before saving (unless skipped)
      if (!flags['skip-validation']) {
        const spinner = createSpinner('Validating credentials...')
        spinner.start()

        try {
          // Set the API endpoint for validation
          config.setApiEndpoint(apiEndpoint)
          
          const validation = await apiClient.validateCredentials({
            clientKey,
            clientSecret,
            projectId,
          })

          spinner.stop()

          if (!validation.valid) {
            logError('Invalid credentials. Please check your client key and secret.')
            logWarning('You can find your credentials in the DXP Cloud portal under API credentials.')
            this.exit(1)
          }

          logSuccess('Credentials validated successfully!')
          if (projectId && validation.projectsFound !== undefined) {
            this.log(`Found ${validation.projectsFound} deployment(s) in project ${projectId}.`)
          } else if (validation.projectsFound !== undefined) {
            this.log(`Access verified. Found ${validation.projectsFound} accessible project(s).`)
          }
        } catch (error) {
          spinner.stop()
          logWarning(`Could not validate credentials due to network error: ${error}`)
          
          const answers = await inquirer.prompt([
            {
              type: 'confirm',
              name: 'proceedAnyway',
              message: 'Continue saving credentials anyway?',
              default: false,
            },
          ])

          if (!answers.proceedAnyway) {
            this.log('Authentication cancelled.')
            this.exit(0)
          }
        }
      } else {
        logWarning('Skipping credential validation.')
      }

      // Save credentials
      await auth.saveCredentials({
        clientKey,
        clientSecret,
        projectId,
      })

      // Update configuration
      config.setApiEndpoint(apiEndpoint)
      if (projectId) {
        config.setDefaultProjectId(projectId)
      }

      logSuccess('Authentication successful!')
      this.log(`API Endpoint: ${apiEndpoint}`)
      if (projectId) {
        this.log(`Default Project ID: ${projectId}`)
      }

      this.log('\nYou can now use other opti commands.')
    } catch (error) {
      logError(`Failed to save credentials: ${error}`)
      this.exit(1)
    }
  }
}