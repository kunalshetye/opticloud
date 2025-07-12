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
} from '../../lib/utils.js'

export default class DeploymentStart extends Command {
  static override summary = 'Start a new deployment'

  static override description = `
Start a new deployment to a target environment.
You can deploy from packages or copy from another environment.
`

  static override examples = [
    '$ opti deployment start --target=integration',
    '$ opti deployment start --target=production --source=preproduction',
    '$ opti deployment start --target=integration --packages=site.cms.app.1.0.0.nupkg',
    '$ opti deployment start --target=production --maintenance-page',
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
      this.log(`Target: ${deployment.targetEnvironment}`)
      if (deployment.sourceEnvironment) {
        this.log(`Source: ${deployment.sourceEnvironment}`)
      }

      this.log('')
      this.log('You can check the deployment status with:')
      this.log(`  opti deployment list --deployment-id=${deployment.id}`)
    } catch (error) {
      spinner.stop()
      logError(`Failed to start deployment: ${formatError(error)}`)
      this.exit(1)
    }
  }
}