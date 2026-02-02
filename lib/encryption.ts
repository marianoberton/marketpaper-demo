/**
 * Encryption utilities for secure storage of API keys and secrets
 * Uses AES-256-GCM for authenticated encryption
 * 
 * IMPORTANT: Set ENCRYPTION_KEY in your environment variables
 * Generate a 32-byte key: openssl rand -hex 32
 */

import { createCipheriv, createDecipheriv, randomBytes } from 'crypto'

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 12 // GCM recommends 12 bytes
const AUTH_TAG_LENGTH = 16

function getEncryptionKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY
  
  if (!key) {
    throw new Error(
      'ENCRYPTION_KEY environment variable is not set. ' +
      'Generate one with: openssl rand -hex 32'
    )
  }
  
  // Key should be 64 hex characters (32 bytes)
  if (key.length !== 64) {
    throw new Error(
      `ENCRYPTION_KEY must be 64 hex characters (32 bytes). Current length: ${key.length}`
    )
  }
  
  return Buffer.from(key, 'hex')
}

export interface EncryptedData {
  encrypted: string
  iv: string
}

/**
 * Encrypt sensitive data using AES-256-GCM
 * @param plaintext - The string to encrypt (typically JSON stringified credentials)
 * @returns Object containing encrypted data and IV (both base64 encoded)
 */
export function encryptSecret(plaintext: string): EncryptedData {
  const key = getEncryptionKey()
  const iv = randomBytes(IV_LENGTH)
  
  const cipher = createCipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_LENGTH })
  
  let encrypted = cipher.update(plaintext, 'utf8', 'base64')
  encrypted += cipher.final('base64')
  
  // Append auth tag to encrypted data
  const authTag = cipher.getAuthTag()
  const encryptedWithTag = Buffer.concat([
    Buffer.from(encrypted, 'base64'),
    authTag
  ]).toString('base64')
  
  return {
    encrypted: encryptedWithTag,
    iv: iv.toString('base64')
  }
}

/**
 * Decrypt data that was encrypted with encryptSecret
 * @param encrypted - Base64 encoded encrypted data (including auth tag)
 * @param iv - Base64 encoded initialization vector
 * @returns Decrypted plaintext string
 */
export function decryptSecret(encrypted: string, iv: string): string {
  const key = getEncryptionKey()
  const ivBuffer = Buffer.from(iv, 'base64')
  const encryptedBuffer = Buffer.from(encrypted, 'base64')
  
  // Extract auth tag from end of encrypted data
  const authTag = encryptedBuffer.slice(-AUTH_TAG_LENGTH)
  const encryptedData = encryptedBuffer.slice(0, -AUTH_TAG_LENGTH)
  
  const decipher = createDecipheriv(ALGORITHM, key, ivBuffer, { authTagLength: AUTH_TAG_LENGTH })
  decipher.setAuthTag(authTag)
  
  let decrypted = decipher.update(encryptedData, undefined, 'utf8')
  decrypted += decipher.final('utf8')
  
  return decrypted
}

/**
 * Encrypt a credentials object (like { api_key: "sk-xxx" })
 */
export function encryptCredentials(credentials: Record<string, string>): EncryptedData {
  return encryptSecret(JSON.stringify(credentials))
}

/**
 * Decrypt credentials back to an object
 */
export function decryptCredentials(encrypted: string, iv: string): Record<string, string> {
  const decrypted = decryptSecret(encrypted, iv)
  return JSON.parse(decrypted)
}

/**
 * Mask a secret for display (e.g., "sk-abc...xyz")
 */
export function maskSecret(secret: string, visibleChars: number = 4): string {
  if (!secret || secret.length <= visibleChars * 2) {
    return '••••••••'
  }
  
  const start = secret.slice(0, visibleChars)
  const end = secret.slice(-visibleChars)
  return `${start}${'•'.repeat(8)}${end}`
}

/**
 * Provider-specific credential schemas
 */
export const PROVIDER_SCHEMAS: Record<string, { fields: string[], optional?: string[] }> = {
  openai: {
    fields: ['api_key'],
    optional: ['organization_id']
  },
  gemini: {
    fields: ['api_key']
  },
  anthropic: {
    fields: ['api_key']
  },
  hubspot: {
    fields: ['api_key'],
    optional: ['portal_id']
  },
  custom: {
    fields: ['api_key'],
    optional: ['base_url', 'extra_headers']
  }
}

export const PROVIDER_LABELS: Record<string, string> = {
  openai: 'OpenAI',
  gemini: 'Google Gemini',
  anthropic: 'Anthropic (Claude)',
  hubspot: 'HubSpot',
  custom: 'Custom API'
}
