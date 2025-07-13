import {homedir} from 'node:os'
import {join} from 'node:path'
import {readFileSync, writeFileSync, existsSync, mkdirSync} from 'node:fs'
import {CliConfig} from './types.js'

export class ConfigManager {
  private configPath: string
  private config: CliConfig

  constructor() {
    // Store config in user's home directory
    const configDir = join(homedir(), '.config', 'opticloud')
    this.configPath = join(configDir, 'config.json')
    
    // Ensure config directory exists
    if (!existsSync(configDir)) {
      mkdirSync(configDir, { recursive: true })
    }

    // Load existing config or create default
    this.config = this.loadConfig()
  }

  private loadConfig(): CliConfig {
    const defaultConfig: CliConfig = {
      apiEndpoint: 'https://paasportal.episerver.net/api/v1.0/',
    }

    try {
      if (existsSync(this.configPath)) {
        const configData = readFileSync(this.configPath, 'utf8')
        return { ...defaultConfig, ...JSON.parse(configData) }
      }
    } catch (error) {
      // If config is corrupted, fall back to default
      console.warn('Warning: Could not load config file, using defaults')
    }

    return defaultConfig
  }

  private saveConfig(): void {
    try {
      writeFileSync(this.configPath, JSON.stringify(this.config, null, 2))
    } catch (error) {
      console.error('Warning: Could not save config file:', error)
    }
  }

  getApiEndpoint(): string {
    return this.config.apiEndpoint
  }

  setApiEndpoint(endpoint: string): void {
    this.config.apiEndpoint = endpoint
    this.saveConfig()
  }

  getDefaultProjectId(): string | undefined {
    return this.config.defaultProjectId
  }

  setDefaultProjectId(projectId: string): void {
    this.config.defaultProjectId = projectId
    this.saveConfig()
  }

  getAll(): CliConfig {
    return { ...this.config }
  }

  reset(): void {
    this.config = {
      apiEndpoint: 'https://paasportal.episerver.net/api/v1.0/',
    }
    this.saveConfig()
  }
}

export const config = new ConfigManager()