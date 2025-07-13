import crypto from 'node:crypto'

export class HmacSigner {
  static createSignature(
    clientKey: string,
    clientSecret: string,
    method: string,
    path: string,
    body: string = '',
  ): {timestamp: string; nonce: string; signature: string; authorization: string} {
    // Validate client secret is base64
    if (!this.isValidBase64(clientSecret)) {
      throw new Error('The ClientSecret is invalid - must be valid base64.')
    }

    const timestamp = Date.now().toString()
    const nonce = crypto.randomUUID().replaceAll('-', '')

    // Create MD5 hash of body
    const bodyHash = crypto.createHash('md5').update(body, 'utf8').digest('base64')

    // Create HMAC signature message
    const message = `${clientKey}${method.toUpperCase()}${path}${timestamp}${nonce}${bodyHash}`

    // Create HMAC signature
    const hmac = crypto.createHmac('sha256', Buffer.from(clientSecret, 'base64'))
    const signature = hmac.update(message, 'utf8').digest('base64')

    // Create authorization header
    const authorization = `epi-hmac ${clientKey}:${timestamp}:${nonce}:${signature}`

    return {
      timestamp,
      nonce,
      signature,
      authorization,
    }
  }

  private static isValidBase64(str: string): boolean {
    try {
      // Check if string length is valid for base64
      if (str.length % 4 !== 0 || str.includes(' ')) {
        return false
      }

      // Try to decode
      Buffer.from(str, 'base64')
      return true
    } catch {
      return false
    }
  }
}