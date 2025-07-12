import {Command, Flags, Args} from '@oclif/core'
import {deploymentService} from '../../lib/deployment-service.js'
import {
  formatError,
  logError,
  logSuccess,
  isValidGuid,
  createSpinner,
  formatDeploymentStatus,
} from '../../lib/utils.js'

export default class DeploymentComplete extends Command {
  static override summary = 'Complete a deployment'

  static override description = `
Complete a deployment that is awaiting verification.
This moves the deployment from "Awaiting Verification" to "Succeeded" status.
`

  static override examples = [
    '$ opti deployment complete 87654321-4321-4321-4321-210987654321',
    '$ opti deployment complete 87654321-4321-4321-4321-210987654321 --project-id=12345678-1234-1234-1234-123456789012',
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
    json: Flags.boolean({
      description: 'Output in JSON format',
      default: false,
    }),
  }

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(DeploymentComplete)

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

    const spinner = createSpinner('Completing deployment...')
    spinner.start()

    try {
      const deployment = await deploymentService.completeDeployment(
        flags['project-id']!,
        args.deploymentId,
      )

      spinner.stop()

      if (flags.json) {
        this.log(JSON.stringify(deployment, null, 2))
        return
      }

      logSuccess('Deployment completed successfully!')
      this.log('')
      this.log(`Deployment ID: ${deployment.id}`)
      this.log(`Status: ${formatDeploymentStatus(deployment.status)}`)
      this.log(`Target: ${deployment.targetEnvironment}`)
    } catch (error) {
      spinner.stop()
      logError(`Failed to complete deployment: ${formatError(error)}`)
      this.exit(1)
    }
  }
}