import {Command, Flags} from '@oclif/core'
import {deploymentService} from '../../lib/deployment-service.js'
import {formatError, logError, isValidGuid, formatDate, formatDeploymentStatus} from '../../lib/utils.js'

export default class DeploymentList extends Command {
  static override summary = 'List deployments for a project'

  static override description = `
List all deployments or get details for a specific deployment.
Shows deployment status, target environment, packages, and timestamps.
`

  static override examples = [
    '$ opti deployment list',
    '$ opti deployment list --project-id=12345678-1234-1234-1234-123456789012',
    '$ opti deployment list --deployment-id=87654321-4321-4321-4321-210987654321',
    '$ opti deployment list --json',
  ]

  static override flags = {
    'project-id': Flags.string({
      char: 'p',
      description: 'Project ID (GUID)',
      env: 'OPTI_PROJECT_ID',
    }),
    'deployment-id': Flags.string({
      char: 'd',
      description: 'Specific deployment ID to retrieve',
    }),
    json: Flags.boolean({
      description: 'Output in JSON format',
      default: false,
    }),
  }

  public async run(): Promise<void> {
    const {flags} = await this.parse(DeploymentList)

    // Validate deployment ID if provided
    if (flags['deployment-id'] && !isValidGuid(flags['deployment-id'])) {
      logError('Deployment ID must be a valid GUID')
      this.exit(1)
    }

    try {
      const deployments = await deploymentService.listDeployments({
        projectId: flags['project-id'] || '',
        id: flags['deployment-id'],
      })

      if (flags.json) {
        this.log(JSON.stringify(deployments, null, 2))
        return
      }

      if (deployments.length === 0) {
        this.log('No deployments found.')
        return
      }

      // Display deployments in a table format
      this.log(`Found ${deployments.length} deployment(s):\\n`)

      for (const deployment of deployments) {
        this.log(`ID: ${deployment.id}`)
        this.log(`Status: ${formatDeploymentStatus(deployment.status)}`)
        
        // Get target environment from parameters or legacy field
        const targetEnv = deployment.parameters?.targetEnvironment || deployment.targetEnvironment
        if (targetEnv) {
          this.log(`Target: ${targetEnv}`)
        }
        
        // Get source environment from parameters or legacy field
        const sourceEnv = deployment.parameters?.sourceEnvironment || deployment.sourceEnvironment
        if (sourceEnv) {
          this.log(`Source: ${sourceEnv}`)
        }

        // Show packages from parameters or legacy field
        const packages = deployment.parameters?.packages || deployment.deploymentPackages?.map(pkg => pkg.name)
        if (packages && packages.length > 0) {
          this.log('Packages:')
          for (const pkg of packages) {
            this.log(`  - ${pkg}`)
          }
        }

        // Show completion percentage if available
        if (deployment.percentComplete !== undefined) {
          this.log(`Progress: ${deployment.percentComplete}%`)
        }

        // Use startTime/endTime or fallback to created/updated
        this.log(`Started: ${formatDate(deployment.startTime || deployment.created)}`)
        if (deployment.endTime || deployment.updated) {
          this.log(`Ended: ${formatDate(deployment.endTime || deployment.updated)}`)
        }

        // Show errors if any
        if (deployment.deploymentErrors && deployment.deploymentErrors.length > 0) {
          this.log(`Errors: ${deployment.deploymentErrors.length} error(s)`)
        }

        this.log('─'.repeat(50))
      }
    } catch (error) {
      logError(`Failed to list deployments: ${formatError(error)}`)
      this.exit(1)
    }
  }
}