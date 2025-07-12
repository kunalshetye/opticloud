import {Command, Flags, Args} from '@oclif/core'
import {deploymentService} from '../../lib/deployment-service.js'
import {formatError, logError, isValidGuid, formatDate, formatDeploymentStatus} from '../../lib/utils.js'

export default class DeploymentLogs extends Command {
  static override summary = 'Show deployment logs and details'

  static override description = `
Display detailed logs for a specific deployment including warnings, errors, and progress information.
This shows the deployment process logs, not application runtime logs.
`

  static override examples = [
    '$ opti deployment logs 12345678-1234-1234-1234-123456789012',
    '$ opti deployment logs 12345678-1234-1234-1234-123456789012 --project-id=87654321-4321-4321-4321-210987654321',
    '$ opti deployment logs 12345678-1234-1234-1234-123456789012 --json',
    '$ opti deployment logs 12345678-1234-1234-1234-123456789012 --errors-only',
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
    'errors-only': Flags.boolean({
      char: 'e',
      description: 'Show only errors (hide warnings)',
      default: false,
    }),
    'warnings-only': Flags.boolean({
      char: 'w',
      description: 'Show only warnings (hide errors)',
      default: false,
    }),
    json: Flags.boolean({
      description: 'Output in JSON format',
      default: false,
    }),
  }

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(DeploymentLogs)

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

    try {
      const deployments = await deploymentService.listDeployments({
        projectId: flags['project-id'] || '',
        id: args.deploymentId,
      })

      if (deployments.length === 0) {
        logError(`Deployment ${args.deploymentId} not found.`)
        this.exit(1)
      }

      const deployment = deployments[0]

      if (flags.json) {
        this.log(JSON.stringify({
          deploymentId: deployment.id,
          status: deployment.status,
          startTime: deployment.startTime,
          endTime: deployment.endTime,
          percentComplete: deployment.percentComplete,
          warnings: deployment.deploymentWarnings || [],
          errors: deployment.deploymentErrors || [],
          validationLinks: deployment.validationLinks || [],
        }, null, 2))
        return
      }

      // Display deployment overview
      this.log(`📋 Deployment Logs: ${deployment.id}`)
      this.log('─'.repeat(60))
      this.log(`Status: ${formatDeploymentStatus(deployment.status)}`)
      
      const targetEnv = deployment.parameters?.targetEnvironment || deployment.targetEnvironment
      if (targetEnv) {
        this.log(`Target Environment: ${targetEnv}`)
      }

      const packages = deployment.parameters?.packages || deployment.deploymentPackages?.map(pkg => pkg.name)
      if (packages && packages.length > 0) {
        this.log(`Packages: ${packages.join(', ')}`)
      }

      if (deployment.percentComplete !== undefined) {
        this.log(`Progress: ${deployment.percentComplete}%`)
      }

      this.log(`Started: ${formatDate(deployment.startTime || deployment.created)}`)
      if (deployment.endTime || deployment.updated) {
        this.log(`Ended: ${formatDate(deployment.endTime || deployment.updated)}`)
      }

      this.log('')

      // Display warnings
      const warnings = deployment.deploymentWarnings || []
      const errors = deployment.deploymentErrors || []
      
      if (!flags['errors-only'] && warnings.length > 0) {
        this.log(`⚠️  Warnings (${warnings.length}):`)
        this.log('─'.repeat(40))
        warnings.forEach((warning, index) => {
          this.log(`${index + 1}. ${warning}`)
        })
        this.log('')
      }

      // Display errors
      if (!flags['warnings-only'] && errors.length > 0) {
        this.log(`❌ Errors (${errors.length}):`)
        this.log('─'.repeat(40))
        errors.forEach((error, index) => {
          this.log(`${index + 1}. ${error}`)
        })
        this.log('')
      }

      // Display validation links if available
      const validationLinks = deployment.validationLinks || []
      if (validationLinks.length > 0) {
        this.log(`🔗 Validation Links (${validationLinks.length}):`)
        this.log('─'.repeat(40))
        validationLinks.forEach((link, index) => {
          this.log(`${index + 1}. ${link}`)
        })
        this.log('')
      }

      // Summary
      if (warnings.length === 0 && errors.length === 0) {
        if (deployment.status.toLowerCase() === 'succeeded') {
          this.log('✅ Deployment completed successfully with no warnings or errors.')
        } else {
          this.log('ℹ️  No deployment warnings or errors recorded.')
        }
      } else {
        this.log(`📊 Summary: ${errors.length} error(s), ${warnings.length} warning(s)`)
      }

      // Show helpful tips
      if (deployment.status.toLowerCase() === 'failed' && errors.length > 0) {
        this.log('')
        this.log('💡 Next steps:')
        this.log('• Review the errors above for specific issues')
        this.log('• Fix any package or configuration problems')
        this.log('• Reset and retry the deployment:')
        this.log(`  opti deployment reset ${deployment.id}`)
      }

    } catch (error) {
      logError(`Failed to get deployment logs: ${formatError(error)}`)
      this.exit(1)
    }
  }
}