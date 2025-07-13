import {Command, Flags} from '@oclif/core'
import {deploymentService} from '../../lib/deployment-service.js'
import {formatError, logError, logInfo, logWarning, isValidGuid, formatDate, formatDeploymentStatus} from '../../lib/utils.js'

export default class DeploymentList extends Command {
  static override summary = 'List deployments for a project'

  static override description = `
List all deployments or get details for a specific deployment.
Shows deployment status, target environment, packages, and timestamps.

Use --watch to monitor deployments in real-time, showing status changes and progress updates.
`

  static override examples = [
    '$ opticloud deployment list',
    '$ opticloud deployment list --project-id=12345678-1234-1234-1234-123456789012',
    '$ opticloud deployment list --deployment-id=87654321-4321-4321-4321-210987654321',
    '$ opticloud deployment list --watch',
    '$ opticloud deployment list --watch --poll-interval=15',
    '$ opticloud deployment list --json',
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
    watch: Flags.boolean({
      char: 'w',
      description: 'Watch deployments in real-time and show updates',
      default: false,
    }),
    'poll-interval': Flags.integer({
      char: 'i',
      description: 'Polling interval in seconds for watch mode',
      default: 10,
      min: 5,
      max: 300,
    }),
    'show-completed': Flags.boolean({
      description: 'Include completed deployments in watch mode',
      default: false,
    }),
    json: Flags.boolean({
      description: 'Output in JSON format',
      default: false,
    }),
  }

  private deploymentStates = new Map<string, any>()

  public async run(): Promise<void> {
    const {flags} = await this.parse(DeploymentList)

    // Validate deployment ID if provided
    if (flags['deployment-id'] && !isValidGuid(flags['deployment-id'])) {
      logError('Deployment ID must be a valid GUID')
      this.exit(1)
    }

    // Handle watch mode
    if (flags.watch) {
      await this.watchDeployments(flags)
      return
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

      this.displayDeployments(deployments, false)
    } catch (error) {
      logError(`Failed to list deployments: ${formatError(error)}`)
      this.exit(1)
    }
  }

  private async watchDeployments(flags: any): Promise<void> {
    if (!flags.json) {
      logInfo('👀 Watching deployments in real-time...')
      this.log(`📊 Polling every ${flags['poll-interval']} seconds (Ctrl+C to stop)`)
      this.log(`⚠️ Updates are only shown when there are changes`)
      if (!flags['show-completed']) {
        this.log(`ℹ️ Completed deployments are hidden (use --show-completed to include them)`)
      }
      this.log('')
    }

    let consecutiveErrors = 0
    const maxErrors = 3

    while (true) {
      try {
        const deployments = await deploymentService.listDeployments({
          projectId: flags['project-id'] || '',
          id: flags['deployment-id'],
        })

        if (flags.json) {
          this.log(JSON.stringify(deployments, null, 2))
        } else {
          this.processDeploymentUpdates(deployments, flags)
        }

        consecutiveErrors = 0
      } catch (error) {
        consecutiveErrors++
        if (consecutiveErrors >= maxErrors) {
          logError(`Too many consecutive errors: ${formatError(error)}`)
          this.exit(1)
        }
        
        if (!flags.json) {
          logWarning(`Polling error (${consecutiveErrors}/${maxErrors}): ${formatError(error)}`)
        }
      }

      // Wait before next poll
      await new Promise(resolve => setTimeout(resolve, flags['poll-interval'] * 1000))
    }
  }

  private processDeploymentUpdates(deployments: any[], flags: any): void {
    const timestamp = new Date().toLocaleTimeString()
    let hasUpdates = false

    for (const deployment of deployments) {
      const currentState = {
        status: deployment.status,
        progress: deployment.percentComplete || 0,
        errorCount: deployment.deploymentErrors?.length || 0,
        warningCount: deployment.deploymentWarnings?.length || 0,
      }

      const lastState = this.deploymentStates.get(deployment.id)
      
      // Skip completed deployments if not requested
      if (!flags['show-completed'] && 
          (deployment.status.toLowerCase() === 'succeeded' || 
           deployment.status.toLowerCase() === 'failed')) {
        if (lastState) {
          this.deploymentStates.delete(deployment.id)
        }
        continue
      }

      // Check for changes
      const hasChanges = !lastState || 
        lastState.status !== currentState.status ||
        lastState.progress !== currentState.progress ||
        lastState.errorCount !== currentState.errorCount ||
        lastState.warningCount !== currentState.warningCount

      if (hasChanges) {
        if (!hasUpdates) {
          this.log(`[${timestamp}] ─── Deployment Updates ───`)
          hasUpdates = true
        }

        this.displayDeploymentUpdate(deployment, lastState, currentState, timestamp)
        this.deploymentStates.set(deployment.id, currentState)
      }
    }

    if (hasUpdates) {
      this.log('')
    }
  }

  private displayDeploymentUpdate(deployment: any, lastState: any, currentState: any, timestamp: string): void {
    const targetEnv = deployment.parameters?.targetEnvironment || deployment.targetEnvironment || 'Unknown'
    
    this.log(`🚀 ${deployment.id.substring(0, 8)}... (${targetEnv})`)
    
    // Status change
    if (!lastState || lastState.status !== currentState.status) {
      const statusChange = lastState ? 
        `${formatDeploymentStatus(lastState.status)} → ${formatDeploymentStatus(currentState.status)}` :
        formatDeploymentStatus(currentState.status)
      this.log(`   Status: ${statusChange}`)
    }

    // Progress change
    if (!lastState || lastState.progress !== currentState.progress) {
      this.log(`   Progress: ${currentState.progress}%`)
    }

    // Error/warning changes
    if (!lastState || 
        lastState.errorCount !== currentState.errorCount || 
        lastState.warningCount !== currentState.warningCount) {
      if (currentState.errorCount > 0 || currentState.warningCount > 0) {
        this.log(`   Issues: ${currentState.errorCount} error(s), ${currentState.warningCount} warning(s)`)
      }
    }

    // Special status notifications
    if (currentState.status.toLowerCase() === 'awaitingverification') {
      this.log(`   💡 Ready for completion: opticloud deployment:complete ${deployment.id}`)
    } else if (currentState.status.toLowerCase() === 'succeeded') {
      this.log(`   ✅ Deployment completed successfully!`)
    } else if (currentState.status.toLowerCase() === 'failed') {
      this.log(`   ❌ Deployment failed - check logs: opticloud deployment:logs ${deployment.id}`)
    }
  }

  private displayDeployments(deployments: any[], isUpdate: boolean): void {
    if (!isUpdate) {
      this.log(`Found ${deployments.length} deployment(s):\n`)
    }

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
      const packages = deployment.parameters?.packages || deployment.deploymentPackages?.map((pkg: any) => pkg.name)
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

      // Show warnings and errors summary
      const warningCount = deployment.deploymentWarnings?.length || 0
      const errorCount = deployment.deploymentErrors?.length || 0
      
      if (warningCount > 0 || errorCount > 0) {
        this.log(`Logs: ${errorCount} error(s), ${warningCount} warning(s)`)
        if (errorCount > 0 || warningCount > 0) {
          this.log(`      Use "opticloud deployment:logs ${deployment.id}" for details`)
        }
      }

      this.log('─'.repeat(50))
    }
  }
}