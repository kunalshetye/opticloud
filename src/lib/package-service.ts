import {createReadStream, statSync, existsSync} from 'node:fs'
import {basename} from 'node:path'
import axios from 'axios'
import {apiClient} from './api-client.js'
import {config} from './config.js'
import {auth} from './auth.js'

export interface PackageUploadOptions {
  filePath: string
  projectId?: string
  blobName?: string
  containerName?: string
  environment?: string
}

export interface SasUrlResponse {
  sasUrl: string
  containerName: string
}

export class PackageService {
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

  private validatePackageFile(filePath: string): void {
    // Check if file exists
    if (!existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`)
    }

    // Check file size (basic validation)
    const stats = statSync(filePath)
    if (stats.size === 0) {
      throw new Error('Package file is empty')
    }

    // Validate file extension and naming pattern
    const fileName = basename(filePath)
    const packagePattern = /^(.+\.)?(((cms|commerce|head)\.app\.(.+)\.(nupkg|zip))|((cms|commerce)\.sqldb\.(.+)\.bacpac))$/i
    
    if (!packagePattern.test(fileName)) {
      throw new Error(`Invalid package name: ${fileName}. Package must match the pattern: [prefix.]cms|commerce|head.app.<version>.nupkg|zip or [prefix.]cms|commerce.sqldb.<version>.bacpac`)
    }
  }

  private async getDeploymentPackageContainer(projectId: string): Promise<{environment: string; containerName: string}> {
    // Try to find a writable container in Integration environment first
    const environment = 'Integration'
    
    try {
      const containers = await apiClient.get<Array<{name: string; isWritable: boolean}>>(`projects/${projectId}/environments/${environment}/storagecontainers`)
      
      // Look for a deployment packages container or any writable container
      const writableContainer = containers.find(c => c.isWritable && (
        c.name.includes('deployment') || 
        c.name.includes('package') || 
        c.name === 'mysitemedia'
      )) || containers.find(c => c.isWritable)
      
      if (!writableContainer) {
        throw new Error('No writable storage container found in Integration environment')
      }
      
      return {
        environment,
        containerName: writableContainer.name
      }
    } catch (error) {
      // Fallback to mysitemedia if listing fails
      return {
        environment,
        containerName: 'mysitemedia'
      }
    }
  }

  async getSasUrl(projectId: string, containerName?: string, environment?: string): Promise<SasUrlResponse> {
    // If container and environment are specified, use the storage container API
    if (containerName && environment) {
      try {
        const response = await apiClient.post<{sasLink: string}>(`projects/${projectId}/environments/${environment}/storagecontainers/${containerName}/saslink`, {
          retentionHours: 24
        })
        
        return {
          sasUrl: response.sasLink,
          containerName: containerName
        }
      } catch (error) {
        console.error('SAS URL generation failed:', error)
        throw new Error(`Failed to get SAS URL for container ${containerName} in ${environment}: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }

    // Use the deployment packages location API (matches PowerShell EpiDeploymentPackageLocation)
    try {
      const response = await apiClient.get<{location: string}>(`projects/${projectId}/packages/location`)
      
      return {
        sasUrl: response.location,
        containerName: 'deploymentpackages' // Default container name for deployment packages
      }
    } catch (error) {
      console.error('Deployment package location failed:', error)
      throw new Error(`Failed to get deployment package location: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async uploadToStorage(sasUrl: string, filePath: string, blobName: string): Promise<void> {
    // Parse the SAS URL to get the base URL and SAS token
    const url = new URL(sasUrl)
    const baseUrl = `${url.protocol}//${url.host}${url.pathname}`
    const sasToken = url.search

    // Construct the blob URL
    const blobUrl = `${baseUrl}/${blobName}${sasToken}`

    const fileStats = statSync(filePath)
    const fileStream = createReadStream(filePath)

    try {
      const response = await axios.put(blobUrl, fileStream, {
        headers: {
          'x-ms-blob-type': 'BlockBlob',
          'Content-Length': fileStats.size.toString(),
          'Content-Type': 'application/octet-stream',
        },
        maxBodyLength: Infinity,
        maxContentLength: Infinity,
      })

      if (response.status !== 201) {
        throw new Error(`Upload failed with status ${response.status}: ${response.statusText}`)
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 412 && error.response?.data?.includes?.('LeaseIdMissing')) {
          throw new Error(`A package named '${blobName}' is already linked to a deployment and cannot be overwritten.`)
        }
        throw new Error(`Upload failed: ${error.response?.status} ${error.response?.statusText}`)
      }
      throw error
    }
  }

  async uploadPackage(options: PackageUploadOptions): Promise<void> {
    const {filePath, blobName, containerName, environment} = options
    const projectId = await this.getProjectId(options.projectId)

    // Validate the package file
    this.validatePackageFile(filePath)

    // Determine blob name (use provided name or file basename)
    const finalBlobName = blobName || basename(filePath)

    // Get SAS URL for upload
    const sasResponse = await this.getSasUrl(projectId, containerName, environment)

    // Upload to Azure Storage
    await this.uploadToStorage(sasResponse.sasUrl, filePath, finalBlobName)
  }
}

export const packageService = new PackageService()