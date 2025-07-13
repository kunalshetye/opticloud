import keytar from 'keytar'
import {AuthCredentials} from './types.js'

const SERVICE_NAME = 'opticloud'
const ACCOUNT_NAME = 'default'

export class AuthManager {
  async saveCredentials(credentials: AuthCredentials): Promise<void> {
    const credentialData = JSON.stringify(credentials)
    await keytar.setPassword(SERVICE_NAME, ACCOUNT_NAME, credentialData)
  }

  async getCredentials(): Promise<AuthCredentials | null> {
    try {
      const credentialData = await keytar.getPassword(SERVICE_NAME, ACCOUNT_NAME)
      if (!credentialData) return null
      return JSON.parse(credentialData) as AuthCredentials
    } catch {
      return null
    }
  }

  async clearCredentials(): Promise<void> {
    await keytar.deletePassword(SERVICE_NAME, ACCOUNT_NAME)
  }

  async hasCredentials(): Promise<boolean> {
    const credentials = await this.getCredentials()
    return credentials !== null && Boolean(credentials.clientKey && credentials.clientSecret)
  }
}

export const auth = new AuthManager()