import {apiClient} from './api-client.js'
import {config} from './config.js'
import {auth} from './auth.js'
import {Deployment, DeploymentStartOptions, DeploymentListOptions} from './types.js'

export class DeploymentService {
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

  async listDeployments(options: DeploymentListOptions): Promise<Deployment[]> {
    const projectId = await this.getProjectId(options.projectId);

    let endpoint = `projects/${projectId}/deployments`
    if (options.id) {
      endpoint += `/${options.id}`
      const deployment = await apiClient.get<Deployment>(endpoint)
      return [deployment]
    }

    return apiClient.get<Deployment[]>(endpoint)
  }

  async startDeployment(options: DeploymentStartOptions): Promise<Deployment> {
    const projectId = await this.getProjectId(options.projectId)

    const payload: any = {
      targetEnvironment: options.targetEnvironment,
    }

    if (options.sourceEnvironment) {
      payload.sourceEnvironment = options.sourceEnvironment
    }

    if (options.sourceApp?.length) {
      payload.sourceApp = options.sourceApp
    }

    if (options.deploymentPackages?.length) {
      payload.Packages = options.deploymentPackages
    }

    if (options.useMaintenancePage !== undefined) {
      payload.useMaintenancePage = options.useMaintenancePage
    }

    return apiClient.post<Deployment>(`projects/${projectId}/deployments`, payload)
  }

  async completeDeployment(projectId: string, deploymentId: string): Promise<Deployment> {
    const resolvedProjectId = await this.getProjectId(projectId)
    return apiClient.post<Deployment>(`projects/${resolvedProjectId}/deployments/${deploymentId}/complete`)
  }

  async resetDeployment(projectId: string, deploymentId: string): Promise<Deployment> {
    const resolvedProjectId = await this.getProjectId(projectId)
    return apiClient.post<Deployment>(`projects/${resolvedProjectId}/deployments/${deploymentId}/reset`)
  }
}

export const deploymentService = new DeploymentService()