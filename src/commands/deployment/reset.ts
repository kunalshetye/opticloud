import {Command, Flags, Args} from '@oclif/core'
import inquirer from 'inquirer'
import {deploymentService} from '../../lib/deployment-service.js'
import {
  formatError,
  logError,
  logSuccess,
  isValidGuid,
  createSpinner,
  formatDeploymentStatus,
  logWarning,
} from '../../lib/utils.js'

export default class DeploymentReset extends Command {
  static override summary = 'Reset a failed deployment'

  static override description = `
Reset a deployment that has failed or is stuck.
This allows you to retry the deployment or take corrective action.
Warning: This action cannot be undone.
`

  static override examples = [
    '$ opti-dxp-cli deployment reset 87654321-4321-4321-4321-210987654321',
    '$ opti-dxp-cli deployment reset 87654321-4321-4321-4321-210987654321 --force',
  ]

  static override args = {
    deploymentId: Args.string({
      name: 'deploymentId',
      required: true,
      description: 'Deployment ID (GUID)',
    }),
  }

  static override flags = {
    'project-id': Flags.string({
      char: 'p',
      description: 'Project ID (GUID)',
      env: 'OPTI_PROJECT_ID',
    }),
    force: Flags.boolean({
      char: 'f',
      description: 'Skip confirmation prompt',
      default: false,
    }),
    json: Flags.boolean({
      description: 'Output in JSON format',
      default: false,
    }),
  }

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(DeploymentReset)

    // Validate deployment ID
    if (!isValidGuid(args.deploymentId)) {
      logError('Deployment ID must be a valid GUID')
      this.exit(1)
    }

    // Validate project ID if provided
    if (flags['project-id'] && !isValidGuid(flags['project-id'])) {
      logError('Project ID must be a valid GUID')
      this.exit(1)
    }

    // Confirmation prompt
    if (!flags.force) {
      logWarning('This will reset the deployment and cannot be undone.')
      const answers = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'confirmed',
          message: `Are you sure you want to reset deployment ${args.deploymentId}?`,
          default: false,
        },
      ])

      if (!answers.confirmed) {
        this.log('Deployment reset cancelled.')
        return
      }
    }

    const spinner = createSpinner('Resetting deployment...')
    spinner.start()

    try {
      const deployment = await deploymentService.resetDeployment(flags['project-id']!, args.deploymentId)

      spinner.stop()

      if (flags.json) {
        this.log(JSON.stringify(deployment, null, 2))
        return
      }

      logSuccess('Deployment reset successfully!')
      this.log('')
      this.log(`Deployment ID: ${deployment.id}`)
      this.log(`Status: ${formatDeploymentStatus(deployment.status)}`)
      this.log(`Target: ${deployment.targetEnvironment}`)
      this.log('')
      this.log('You can now retry the deployment or take corrective action.')
    } catch (error) {
      spinner.stop()
      logError(`Failed to reset deployment: ${formatError(error)}`)
      this.exit(1)
    }
  }
}