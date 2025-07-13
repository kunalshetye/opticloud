export interface ApiResponse<T = any> {
  success: boolean
  result?: T
  errors?: string[]
}

export interface DeploymentPackage {
  id: string
  name: string
  created: string
}

export interface Deployment {
  id: string
  projectId: string
  status: string
  startTime?: string
  endTime?: string
  percentComplete?: number
  validationLinks?: string[]
  deploymentWarnings?: string[]
  deploymentErrors?: string[]
  parameters?: {
    targetEnvironment?: string
    sourceEnvironment?: string
    packages?: string[]
    maintenancePage?: boolean
    zeroDowntimeMode?: string
  }
  // Legacy fields for backward compatibility
  deploymentPackages?: DeploymentPackage[]
  targetEnvironment?: string
  sourceEnvironment?: string
  created?: string
  updated?: string
}

export interface DatabaseExport {
  id: string
  projectId: string
  environment: string
  status: string
  created: string
  updated: string
}

export interface StorageContainer {
  name: string
  sasLink: string
}

export interface AuthCredentials {
  clientKey: string
  clientSecret: string
  projectId?: string
}

export interface CliConfig {
  apiEndpoint: string
  defaultProjectId?: string
}

export interface DeploymentStartOptions {
  projectId: string
  targetEnvironment: string
  sourceEnvironment?: string
  deploymentPackages?: string[]
  useMaintenancePage?: boolean
  sourceApp?: string[]
}

export interface DeploymentListOptions {
  projectId: string
  id?: string
}

export interface PackageInfo {
  name?: string
  fileName?: string
  size?: number
  created?: string
  lastModified?: string
}