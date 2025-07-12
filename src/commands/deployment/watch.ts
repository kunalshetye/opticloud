import {Command, Flags, Args} from '@oclif/core'
import {deploymentService} from '../../lib/deployment-service.js'
import {
  formatError,
  logError,
  logSuccess,
  isValidGuid,
  formatDeploymentStatus,
  logInfo,
  logWarning,
} from '../../lib/utils.js'

export default class DeploymentWatch extends Command {
  static override summary = 'Watch deployment progress in real-time'

  static override description = `
Monitor an existing deployment and show real-time status updates.
Polls the API at regular intervals to track progress, status changes, and log events.
`

  static override examples = [
    '$ opti-dxp-cli deployment watch 12345678-1234-1234-1234-123456789012',
    '$ opti-dxp-cli deployment watch 12345678-1234-1234-1234-123456789012 --poll-interval=30',
    '$ opti-dxp-cli deployment watch 12345678-1234-1234-1234-123456789012 --project-id=87654321-4321-4321-4321-210987654321',
  ]

  static override args = {
    deploymentId: Args.string({
      name: 'deploymentId',
      required: true,
      description: 'Deployment ID (GUID) to watch',
    }),
  }

  static override flags = {
    'project-id': Flags.string({
      char: 'p',
      description: 'Project ID (GUID)',
      env: 'OPTI_PROJECT_ID',
    }),
    'poll-interval': Flags.integer({
      char: 'i',
      description: 'Polling interval in seconds',
      default: 10,
      min: 5,
      max: 300,
    }),
    'show-initial': Flags.boolean({
      description: 'Show initial deployment status before watching',
      default: true,
    }),
    'continue-on-errors': Flags.boolean({
      description: 'Continue watching even when errors are detected',
      default: false,
    }),
  }

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(DeploymentWatch)

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
      // Get initial deployment status
      const deployments = await deploymentService.listDeployments({
        projectId: flags['project-id'] || '',
        id: args.deploymentId,
      })

      if (deployments.length === 0) {
        logError(`Deployment ${args.deploymentId} not found.`)
        this.exit(1)
      }

      const deployment = deployments[0]

      if (flags['show-initial']) {
        this.log(`📋 Deployment: ${deployment.id}`)
        this.log(`📊 Current Status: ${formatDeploymentStatus(deployment.status)}`)
        
        const targetEnv = deployment.parameters?.targetEnvironment || deployment.targetEnvironment
        if (targetEnv) {
          this.log(`🎯 Target: ${targetEnv}`)
        }

        const packages = deployment.parameters?.packages || deployment.deploymentPackages?.map(pkg => pkg.name)
        if (packages && packages.length > 0) {
          this.log(`📦 Packages: ${packages.join(', ')}`)
        }

        if (deployment.percentComplete !== undefined) {
          this.log(`⏳ Progress: ${deployment.percentComplete}%`)
        }

        this.log('')
      }

      // Check if deployment is already complete
      const status = deployment.status.toLowerCase()
      if (status === 'succeeded' || status === 'failed' || status === 'awaitingverification') {
        logInfo(`Deployment is already in final state: ${formatDeploymentStatus(deployment.status)}`)
        if (status === 'failed') {
          this.log(`Use "opti-dxp-cli deployment:logs ${deployment.id}" to see error details`)
        } else if (status === 'awaitingverification') {
          this.log(`Use "opti-dxp-cli deployment:complete ${deployment.id}" to complete the deployment`)
        }
        return
      }

      this.log('👀 Watching deployment progress...')
      this.log(`📊 Polling every ${flags['poll-interval']} seconds (Ctrl+C to stop)`)
      this.log('')

      await this.watchDeployment(args.deploymentId, flags['poll-interval'], flags['project-id'], flags['continue-on-errors'])

    } catch (error) {
      logError(`Failed to watch deployment: ${formatError(error)}`)
      this.exit(1)
    }
  }

  private async watchDeployment(deploymentId: string, pollInterval: number, projectId?: string, continueOnErrors = false): Promise<void> {
    let lastStatus = ''
    let lastProgress = -1
    let lastWarningCount = 0
    let lastErrorCount = 0
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
        const currentWarningCount = deployment.deploymentWarnings?.length || 0
        const currentErrorCount = deployment.deploymentErrors?.length || 0

        const timestamp = new Date().toLocaleTimeString()

        // Status changed
        if (currentStatus !== lastStatus && lastStatus !== '') {
          this.log(`[${timestamp}] 🔄 Status: ${lastStatus} → ${formatDeploymentStatus(currentStatus)}`)
        }
        lastStatus = currentStatus

        // Progress changed
        if (currentProgress !== lastProgress && currentProgress > lastProgress) {
          this.log(`[${timestamp}] ⏳ Progress: ${currentProgress}%`)
        }
        lastProgress = Math.max(lastProgress, currentProgress)

        // Handle errors - show them and potentially exit watch mode
        if (currentErrorCount > lastErrorCount && !errorsShown) {
          this.log(`[${timestamp}] ❌ ${currentErrorCount} error(s) detected:`)
          this.log('')
          
          deployment.deploymentErrors?.forEach((error, index) => {
            // Handle empty or incomplete error messages properly
            if (!error || error.trim().length === 0) {
              this.log(`${index + 1}. (Empty error message)`)
            } else if (error.trim() === 'Install output:' || (error.trim().endsWith(':') && error.trim().length < 20)) {
              this.log(`${index + 1}. ${error} (Incomplete error message)`)
            } else {
              this.log(`${index + 1}. ${error}`)
            }
          })
          
          this.log('')
          errorsShown = true
          
          if (!continueOnErrors) {
            logError('Errors detected during deployment. Exiting watch mode.')
            this.log(`📋 Use "opti-dxp-cli deployment:logs ${deploymentId}" for full details`)
            this.log(`🔄 Use "opti-dxp-cli deployment:reset ${deploymentId}" to reset and retry`)
            this.log(`💡 Use --continue-on-errors to keep watching despite errors`)
            break
          } else {
            logWarning('Errors detected but continuing to watch (--continue-on-errors enabled)')
          }
        }
        
        // Handle warnings (but continue watching)
        if (currentWarningCount > lastWarningCount) {
          const newWarnings = currentWarningCount - lastWarningCount
          this.log(`[${timestamp}] ⚠️  ${newWarnings} new warning(s) (${currentWarningCount} total)`)
        }
        
        lastWarningCount = currentWarningCount
        lastErrorCount = currentErrorCount

        // Check if deployment is complete
        if (currentStatus.toLowerCase() === 'succeeded') {
          this.log('')
          logSuccess(`🎉 Deployment completed successfully! (${currentProgress}%)`)
          if (currentWarningCount > 0) {
            logInfo(`⚠️  Completed with ${currentWarningCount} warning(s)`)
          }
          break
        } else if (currentStatus.toLowerCase() === 'failed') {
          this.log('')
          logError(`💥 Deployment failed!`)
          if (currentErrorCount > 0) {
            this.log(`❌ ${currentErrorCount} error(s) recorded`)
          }
          this.log(`📋 Use "opti-dxp-cli deployment:logs ${deploymentId}" for detailed error information`)
          this.log(`🔄 Use "opti-dxp-cli deployment:reset ${deploymentId}" to reset and retry`)
          break
        } else if (currentStatus.toLowerCase() === 'awaitingverification') {
          this.log('')
          logInfo(`✋ Deployment is awaiting verification`)
          this.log(`✅ Use "opti-dxp-cli deployment:complete ${deploymentId}" when ready to complete`)
          break
        }

        // Reset error counter on successful poll
        consecutiveErrors = 0

      } catch (error) {
        consecutiveErrors++
        const timestamp = new Date().toLocaleTimeString()
        logWarning(`[${timestamp}] ⚠️  Failed to fetch status (${consecutiveErrors}/${maxErrors}): ${formatError(error)}`)
        
        if (consecutiveErrors >= maxErrors) {
          logError('❌ Too many consecutive errors. Stopping watch mode.')
          this.log('🔄 Try running the command again or check your network connection.')
          break
        }
      }

      // Wait before next poll
      await new Promise(resolve => setTimeout(resolve, pollInterval * 1000))
    }
  }
}