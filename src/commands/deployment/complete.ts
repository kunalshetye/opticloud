import {Command, Flags, Args} from '@oclif/core'
import {deploymentService} from '../../lib/deployment-service.js'
import {
  formatError,
  logError,
  logSuccess,
  isValidGuid,
  createSpinner,
  formatDeploymentStatus,
  logInfo,
  logWarning,
} from '../../lib/utils.js'

export default class DeploymentComplete extends Command {
  static override summary = 'Complete a deployment'

  static override description = `
Complete a deployment that is awaiting verification.
This moves the deployment from "Awaiting Verification" to "Succeeded" status.
`

  static override examples = [
    '$ opticloud deployment complete 87654321-4321-4321-4321-210987654321',
    '$ opticloud deployment complete 87654321-4321-4321-4321-210987654321 --project-id=12345678-1234-1234-1234-123456789012',
    '$ opticloud deployment complete 87654321-4321-4321-4321-210987654321 --watch',
    '$ opticloud deployment complete 87654321-4321-4321-4321-210987654321 --watch --poll-interval=15',
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
    watch: Flags.boolean({
      description: 'Watch deployment progress after completion and show real-time updates',
      default: false,
    }),
    'poll-interval': Flags.integer({
      description: 'Polling interval in seconds for watch mode',
      default: 10,
      min: 5,
      max: 300,
    }),
    'continue-on-errors': Flags.boolean({
      description: 'Continue watching even when errors are detected',
      default: false,
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
      const targetEnv = deployment.parameters?.targetEnvironment || deployment.targetEnvironment
      if (targetEnv && targetEnv !== 'undefined') {
        this.log(`Target: ${targetEnv}`)
      }

      this.log('')

      // Watch mode: poll for status updates after completion
      if (flags.watch && !flags.json) {
        this.log('👀 Watching deployment progress...')
        this.log(`📊 Polling every ${flags['poll-interval']} seconds (Ctrl+C to stop)`)
        this.log(`⚠️ Polling results are only shown if there are any changes`)
        this.log('')
        
        await this.watchDeployment(args.deploymentId, flags['poll-interval'], flags['project-id'], flags['continue-on-errors'])
      } else if (!flags.watch) {
        this.log('💡 Use --watch to monitor deployment progress in real-time')
      }
    } catch (error) {
      spinner.stop()
      logError(`Failed to complete deployment: ${formatError(error)}`)
      this.exit(1)
    }
  }

  private async watchDeployment(deploymentId: string, pollInterval: number, projectId?: string, continueOnErrors = false): Promise<void> {
    let lastStatus = ''
    let lastProgress = -1
    let lastErrorCount = 0
    let lastWarningCount = 0
    let consecutiveErrors = 0
    let errorsShown = false
    const maxErrors = 3

    while (true) {
      try {
        const deployments = await deploymentService.listDeployments({
          projectId: projectId || '',
          id: deploymentId,
        })

        if (deployments.length === 0) {
          logError('Deployment not found')
          break
        }

        const deployment = deployments[0]
        const currentStatus = deployment.status
        const currentProgress = deployment.percentComplete || 0

        // Status changed
        if (currentStatus !== lastStatus) {
          const timestamp = new Date().toLocaleTimeString()
          this.log(`[${timestamp}] Status: ${lastStatus} → ${formatDeploymentStatus(currentStatus)}`)
          lastStatus = currentStatus
        }

        // Progress changed
        if (currentProgress !== lastProgress && currentProgress > lastProgress) {
          const timestamp = new Date().toLocaleTimeString()
          this.log(`[${timestamp}] Progress: ${currentProgress}%`)
          lastProgress = currentProgress
        }

        // Show new warnings/errors
        const warningCount = deployment.deploymentWarnings?.length || 0
        const errorCount = deployment.deploymentErrors?.length || 0
        
        // If we have new errors, show them and potentially exit watch mode
        if (errorCount > lastErrorCount && !errorsShown) {
          const timestamp = new Date().toLocaleTimeString()
          this.log(`[${timestamp}] ❌ ${errorCount} error(s) detected:`)
          this.log('')
          
          deployment.deploymentErrors?.forEach((error, index) => {
            // Handle empty or incomplete error messages properly
            if (!error || error.trim().length === 0) {
              this.log(`${index + 1}. (Empty error message)`)
            } else if (error.trim() === 'Install output:' || error.trim().endsWith(':') && error.trim().length < 20) {
              this.log(`${index + 1}. ${error} (Incomplete error message)`)
            } else {
              this.log(`${index + 1}. ${error}`)
            }
          })
          
          this.log('')
          errorsShown = true
          
          if (!continueOnErrors) {
            logError('Errors detected during deployment. Exiting watch mode.')
            this.log(`📋 Use "opticloud deployment:logs ${deploymentId}" for full details`)
            this.log(`🔄 Use "opticloud deployment:reset ${deploymentId}" to reset and retry`)
            this.log(`💡 Use --continue-on-errors to keep watching despite errors`)
            break
          } else {
            logWarning('Errors detected but continuing to watch (--continue-on-errors enabled)')
          }
        }
        lastErrorCount = errorCount
        
        // Show new warnings (but continue watching)
        if (warningCount > lastWarningCount) {
          const timestamp = new Date().toLocaleTimeString()
          this.log(`[${timestamp}] ⚠️  ${warningCount} warning(s) detected`)
        }
        lastWarningCount = warningCount

        // Check if deployment is complete
        if (currentStatus.toLowerCase() === 'succeeded') {
          logSuccess(`Deployment completed successfully! (${currentProgress}%)`)
          break
        } else if (currentStatus.toLowerCase() === 'failed') {
          logError(`Deployment failed! Use "opticloud deployment:logs ${deploymentId}" for details`)
          break
        } else if (currentStatus.toLowerCase() === 'awaitingverification') {
          logInfo(`Deployment is awaiting verification. Use "opticloud deployment:complete ${deploymentId}" when ready.`)
          break
        }

        // Reset error counter on successful poll
        consecutiveErrors = 0

      } catch (error) {
        consecutiveErrors++
        const timestamp = new Date().toLocaleTimeString()
        logWarning(`[${timestamp}] Failed to fetch deployment status (${consecutiveErrors}/${maxErrors}): ${formatError(error)}`)
        
        if (consecutiveErrors >= maxErrors) {
          logError('Too many consecutive errors. Stopping watch mode.')
          break
        }
      }

      // Wait before next poll
      await new Promise(resolve => setTimeout(resolve, pollInterval * 1000))
    }
  }
}