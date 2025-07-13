import {Command, Flags} from '@oclif/core'
import inquirer from 'inquirer'
import {deploymentService} from '../../lib/deployment-service.js'
import {
  formatError,
  logError,
  logSuccess,
  isValidGuid,
  validateEnvironment,
  createSpinner,
  formatDeploymentStatus,
  logInfo,
  logWarning,
} from '../../lib/utils.js'

export default class DeploymentStart extends Command {
  static override summary = 'Start a new deployment'

  static override description = `
Start a new deployment to a target environment.
You can deploy from packages or copy from another environment.
`

  static override examples = [
    '$ opticloud deployment start --target=integration',
    '$ opticloud deployment start --target=production --source=preproduction',
    '$ opticloud deployment start --target=integration --packages=site.cms.app.1.0.0.nupkg',
    '$ opticloud deployment start --target=production --maintenance-page',
    '$ opticloud deployment start --target=integration --packages=app.zip --watch',
    '$ opticloud deployment start --target=production --packages=app.zip --watch --poll-interval=30',
    '$ opticloud deployment start --target=integration --packages=app.zip --watch --continue-on-errors',
  ]

  static override flags = {
    'project-id': Flags.string({
      char: 'p',
      description: 'Project ID (GUID)',
      env: 'OPTI_PROJECT_ID',
    }),
    target: Flags.string({
      char: 't',
      description: 'Target environment',
      required: true,
    }),
    source: Flags.string({
      char: 's',
      description: 'Source environment (for environment-to-environment deployment)',
    }),
    packages: Flags.string({
      description: 'Deployment packages (comma-separated)',
      multiple: true,
    }),
    'source-app': Flags.string({
      description: 'Source applications (comma-separated)',
      multiple: true,
    }),
    'maintenance-page': Flags.boolean({
      char: 'm',
      description: 'Use maintenance page during deployment',
      default: false,
    }),
    interactive: Flags.boolean({
      char: 'i',
      description: 'Use interactive mode',
      default: false,
    }),
    watch: Flags.boolean({
      description: 'Watch deployment progress and show real-time updates',
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
    const {flags} = await this.parse(DeploymentStart)

    let {
      'project-id': projectId,
      target,
      source,
      packages,
      'source-app': sourceApp,
      'maintenance-page': maintenancePage,
    } = flags

    // Interactive mode
    if (flags.interactive) {
      const answers = await inquirer.prompt([
        {
          type: 'list',
          name: 'target',
          message: 'Select target environment:',
          choices: ['integration', 'preproduction', 'production'],
          when: () => !target,
        },
        {
          type: 'list',
          name: 'deploymentType',
          message: 'Deployment type:',
          choices: [
            {name: 'Deploy packages', value: 'packages'},
            {name: 'Copy from environment', value: 'environment'},
          ],
        },
        {
          type: 'list',
          name: 'source',
          message: 'Select source environment:',
          choices: ['integration', 'preproduction', 'production'],
          when: (answers) => answers.deploymentType === 'environment',
        },
        {
          type: 'input',
          name: 'packages',
          message: 'Enter package names (comma-separated):',
          when: (answers) => answers.deploymentType === 'packages',
          filter: (input: string) => input.split(',').map((s: string) => s.trim()),
        },
        {
          type: 'confirm',
          name: 'maintenancePage',
          message: 'Use maintenance page during deployment?',
          default: false,
        },
      ])

      target = target || answers.target
      source = answers.source
      packages = packages?.length ? packages : answers.packages
      maintenancePage = answers.maintenancePage
    }

    // Basic validation (allow any environment name)
    if (!target || target.trim().length === 0) {
      logError('Target environment is required')
      this.exit(1)
    }

    if (projectId && !isValidGuid(projectId)) {
      logError('Project ID must be a valid GUID')
      this.exit(1)
    }

    if (!source && (!packages || packages.length === 0)) {
      logError('Either source environment or deployment packages must be specified')
      this.exit(1)
    }

    const spinner = createSpinner('Starting deployment...')
    spinner.start()

    try {
      const deployment = await deploymentService.startDeployment({
        projectId: projectId!,
        targetEnvironment: target,
        sourceEnvironment: source,
        deploymentPackages: packages,
        sourceApp,
        useMaintenancePage: maintenancePage,
      })

      spinner.stop()

      if (flags.json) {
        this.log(JSON.stringify(deployment, null, 2))
        return
      }

      logSuccess('Deployment started successfully!')
      this.log('')
      this.log(`Deployment ID: ${deployment.id}`)
      this.log(`Status: ${formatDeploymentStatus(deployment.status)}`)
      
      // Get target environment from parameters, legacy field, or fallback to the requested target
      const targetEnv = deployment.parameters?.targetEnvironment || deployment.targetEnvironment || target
      if (targetEnv && targetEnv !== 'undefined') {
        this.log(`Target: ${targetEnv}`)
      }
      
      // Get source environment from parameters or legacy field
      const sourceEnv = deployment.parameters?.sourceEnvironment || deployment.sourceEnvironment
      if (sourceEnv) {
        this.log(`Source: ${sourceEnv}`)
      }

      this.log('')
      
      // Watch mode: poll for status updates
      if (flags.watch && !flags.json) {
        this.log('👀 Watching deployment progress...')
        this.log(`📊 Polling every ${flags['poll-interval']} seconds (Ctrl+C to stop)`)
        this.log(`⚠️ Polling results are only shown if there are any changes`)
        this.log('')
        
        await this.watchDeployment(deployment.id, flags['poll-interval'], flags['project-id'], flags['continue-on-errors'])
      } else {
        this.log('You can check the deployment status with:')
        this.log(`  opti deployment list --deployment-id=${deployment.id}`)
        
        if (!flags.watch) {
          this.log('')
          this.log('💡 Use --watch to monitor deployment progress in real-time')
        }
      }
    } catch (error) {
      spinner.stop()
      logError(`Failed to start deployment: ${formatError(error)}`)
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