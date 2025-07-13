import {Command, Flags} from '@oclif/core'
import {apiClient} from '../../lib/api-client.js'
import {config} from '../../lib/config.js'
import {auth} from '../../lib/auth.js'
import {PackageInfo} from '../../lib/types.js'
import {formatError, logError, isValidGuid, formatDate} from '../../lib/utils.js'

export default class PackageList extends Command {
  static override summary = 'List available deployment packages'

  static override description = `
List all deployment packages available in the project's storage container.
Shows package names, sizes, and upload dates.
`

  static override examples = [
    '$ opticloud package list',
    '$ opticloud package list --project-id=12345678-1234-1234-1234-123456789012',
    '$ opticloud package list --json',
  ]

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

  private async getProjectId(providedId?: string): Promise<string> {
    if (providedId) return providedId
    
    // Try credentials first, then config
    const credentials = await auth.getCredentials()
    const projectId = credentials?.projectId || config.getDefaultProjectId()
    
    if (!projectId) {
      throw new Error('Project ID is required. Provide via --project-id or set a default during login.')
    }
    
    return projectId
  }

  public async run(): Promise<void> {
    const {flags} = await this.parse(PackageList)

    // Validate project ID if provided
    if (flags['project-id'] && !isValidGuid(flags['project-id'])) {
      logError('Project ID must be a valid GUID')
      this.exit(1)
    }

    try {
      const projectId = await this.getProjectId(flags['project-id'])
      const packages = await apiClient.get<PackageInfo[]>(`projects/${projectId}/packages`)

      if (flags.json) {
        this.log(JSON.stringify(packages, null, 2))
        return
      }

      if (!packages || (Array.isArray(packages) && packages.length === 0)) {
        this.log('No packages found.')
        return
      }

      this.log(`Found ${Array.isArray(packages) ? packages.length : 1} package(s):\\n`)

      if (Array.isArray(packages)) {
        for (const pkg of packages) {
          this.log(`Name: ${pkg.name || pkg.fileName || 'Unknown'}`)
          if (pkg.size) {
            this.log(`Size: ${(pkg.size / 1024 / 1024).toFixed(2)} MB`)
          }
          if (pkg.created || pkg.lastModified) {
            this.log(`Uploaded: ${formatDate((pkg.created || pkg.lastModified)!)}`)
          }
          this.log('─'.repeat(50))
        }
      }
    } catch (error) {
      logError(`Failed to list packages: ${formatError(error)}`)
      this.exit(1)
    }
  }
}