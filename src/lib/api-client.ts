import axios, {AxiosInstance, AxiosRequestConfig, AxiosResponse} from 'axios'
import {URL} from 'node:url'
import {auth} from './auth.js'
import {config} from './config.js'
import {HmacSigner} from './hmac.js'
import {ApiResponse, AuthCredentials} from './types.js'

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public errors?: string[],
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

export class ApiClient {
  private client: AxiosInstance
  private credentials: AuthCredentials | null = null

  constructor() {
    this.client = axios.create({
      timeout: 120_000,
      headers: {
        'Content-Type': 'application/json',
      },
    })

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response) {
          const {status, data} = error.response
          const errorMessage = data?.message || error.message || 'API request failed'
          const errors = data?.errors || []
          throw new ApiError(status, errorMessage, errors)
        }

        throw error
      },
    )
  }

  async initialize(): Promise<void> {
    this.credentials = await auth.getCredentials()
    if (!this.credentials) {
      throw new Error('No authentication credentials found. Please run "opti auth login" first.')
    }
  }

  private createAuthHeaders(method: string, path: string, body?: any): Record<string, string> {
    if (!this.credentials) {
      throw new Error('API client not initialized. Call initialize() first.')
    }

    const bodyString = body ? JSON.stringify(body) : ''
    const {authorization} = HmacSigner.createSignature(
      this.credentials.clientKey,
      this.credentials.clientSecret,
      method,
      path,
      bodyString,
    )

    return {
      Authorization: authorization,
    }
  }

  private async request<T>(
    method: string,
    endpoint: string,
    data?: any,
    options?: AxiosRequestConfig,
  ): Promise<T> {
    if (!this.credentials) {
      await this.initialize()
    }

    const baseUrl = config.getApiEndpoint()
    const url = new URL(endpoint, baseUrl)
    const path = url.pathname + url.search

    const headers = {
      ...this.createAuthHeaders(method, path, data),
      ...(options?.headers || {}),
    }

    const requestConfig: AxiosRequestConfig = {
      method,
      url: url.toString(),
      headers,
      ...options,
    }

    if (data) {
      requestConfig.data = data
    }

    try {
      const response: AxiosResponse<ApiResponse<T>> = await this.client.request(requestConfig)

      if (!response.data.success) {
        const errorMessage = response.data.errors?.join(', ') || 'API call failed'
        throw new ApiError(response.status, errorMessage, response.data.errors)
      }

      return response.data.result as T
    } catch (error) {
      if (error instanceof ApiError) {
        throw error
      }

      if (axios.isAxiosError(error)) {
        const status = error.response?.status || 0
        const statusText = error.response?.statusText || 'Unknown'
        const errorData = error.response?.data
        
        let message = `HTTP ${status}: ${statusText}`
        if (errorData) {
          if (typeof errorData === 'string') {
            message += ` - ${errorData}`
          } else if (errorData.message) {
            message += ` - ${errorData.message}`
          } else if (errorData.error) {
            message += ` - ${errorData.error}`
          }
        }
        
        throw new ApiError(status, message)
      }

      // Handle network errors, timeouts, etc.
      throw new ApiError(0, `Network error: ${error}`)
    }
  }

  async get<T>(endpoint: string, options?: AxiosRequestConfig): Promise<T> {
    return this.request<T>('GET', endpoint, undefined, options)
  }

  async post<T>(endpoint: string, data?: any, options?: AxiosRequestConfig): Promise<T> {
    return this.request<T>('POST', endpoint, data, options)
  }

  async put<T>(endpoint: string, data?: any, options?: AxiosRequestConfig): Promise<T> {
    return this.request<T>('PUT', endpoint, data, options)
  }

  async delete<T>(endpoint: string, options?: AxiosRequestConfig): Promise<T> {
    return this.request<T>('DELETE', endpoint, undefined, options)
  }

  setCredentials(credentials: AuthCredentials): void {
    this.credentials = credentials
  }

  async validateCredentials(credentials: AuthCredentials): Promise<{valid: boolean; projectsFound?: number}> {
    // Temporarily set credentials for validation
    const originalCredentials = this.credentials
    this.credentials = credentials

    try {
      // Use deployments endpoint for validation - requires project ID
      let endpoint = 'projects'
      let projectsData = null
      
      if (credentials.projectId) {
        // If we have a project ID, try the deployments endpoint which is more representative
        endpoint = `projects/${credentials.projectId}/deployments`
        const deployments = await this.get(endpoint)
        return { valid: true, projectsFound: Array.isArray(deployments) ? deployments.length : 0 }
      } else {
        // Fallback to projects endpoint if no project ID
        projectsData = await this.get('projects')
        const projectCount = Array.isArray(projectsData) ? projectsData.length : 0
        return { valid: true, projectsFound: projectCount }
      }
    } catch (error) {
      if (error instanceof ApiError) {
        // Clear authentication/authorization errors indicate invalid credentials
        if (error.status === 401 || error.status === 403) {
          return { valid: false }
        }
        // For other HTTP errors, credentials might be valid but there's another issue
        throw new Error(`API validation failed with status ${error.status}: ${error.message}`)
      }
      // For network errors, etc., re-throw to let caller decide
      throw error
    } finally {
      // Restore original credentials
      this.credentials = originalCredentials
    }
  }
}

export const apiClient = new ApiClient()