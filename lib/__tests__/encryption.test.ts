import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  encryptSecret,
  decryptSecret,
  encryptCredentials,
  decryptCredentials,
  maskSecret,
} from '../encryption'

// Test encryption key (64 hex chars = 32 bytes)
const TEST_ENCRYPTION_KEY = 'a'.repeat(64)

describe('Encryption Module', () => {
  beforeEach(() => {
    vi.stubEnv('ENCRYPTION_KEY', TEST_ENCRYPTION_KEY)
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  describe('encryptSecret', () => {
    it('should encrypt plaintext and return encrypted data with IV', () => {
      const plaintext = 'my-secret-api-key'
      const result = encryptSecret(plaintext)

      expect(result).toHaveProperty('encrypted')
      expect(result).toHaveProperty('iv')
      expect(result.encrypted).toBeTruthy()
      expect(result.iv).toBeTruthy()
      // Encrypted should be base64
      expect(() => Buffer.from(result.encrypted, 'base64')).not.toThrow()
      expect(() => Buffer.from(result.iv, 'base64')).not.toThrow()
    })

    it('should generate unique IVs for each encryption', () => {
      const plaintext = 'same-secret'
      const result1 = encryptSecret(plaintext)
      const result2 = encryptSecret(plaintext)

      // IVs should be different
      expect(result1.iv).not.toBe(result2.iv)
      // Encrypted data should also be different due to different IVs
      expect(result1.encrypted).not.toBe(result2.encrypted)
    })

    it('should handle empty string', () => {
      const result = encryptSecret('')
      expect(result.encrypted).toBeTruthy()
      expect(result.iv).toBeTruthy()
    })

    it('should handle special characters', () => {
      const plaintext = 'secret-with-特殊字符-émojis-🔐'
      const result = encryptSecret(plaintext)
      expect(result.encrypted).toBeTruthy()

      // Verify it can be decrypted back
      const decrypted = decryptSecret(result.encrypted, result.iv)
      expect(decrypted).toBe(plaintext)
    })

    it('should handle long strings', () => {
      const plaintext = 'x'.repeat(10000)
      const result = encryptSecret(plaintext)
      expect(result.encrypted).toBeTruthy()

      const decrypted = decryptSecret(result.encrypted, result.iv)
      expect(decrypted).toBe(plaintext)
    })
  })

  describe('decryptSecret', () => {
    it('should decrypt data encrypted with encryptSecret', () => {
      const original = 'my-secret-api-key-12345'
      const encrypted = encryptSecret(original)
      const decrypted = decryptSecret(encrypted.encrypted, encrypted.iv)

      expect(decrypted).toBe(original)
    })

    it('should fail with wrong IV', () => {
      const original = 'secret-data'
      const encrypted = encryptSecret(original)

      // Create a different IV
      const wrongIv = Buffer.from('wrong-iv-1234567').toString('base64')

      expect(() => {
        decryptSecret(encrypted.encrypted, wrongIv)
      }).toThrow()
    })

    it('should fail with tampered encrypted data', () => {
      const original = 'secret-data'
      const encrypted = encryptSecret(original)

      // Tamper with the encrypted data
      const tamperedBuffer = Buffer.from(encrypted.encrypted, 'base64')
      tamperedBuffer[0] = tamperedBuffer[0] ^ 0xFF // Flip bits
      const tampered = tamperedBuffer.toString('base64')

      expect(() => {
        decryptSecret(tampered, encrypted.iv)
      }).toThrow()
    })

    it('should fail with truncated auth tag', () => {
      const original = 'secret-data'
      const encrypted = encryptSecret(original)

      // Remove part of the auth tag
      const truncatedBuffer = Buffer.from(encrypted.encrypted, 'base64')
      const truncated = truncatedBuffer.slice(0, -5).toString('base64')

      expect(() => {
        decryptSecret(truncated, encrypted.iv)
      }).toThrow()
    })
  })

  describe('encryptCredentials', () => {
    it('should encrypt credentials object', () => {
      const credentials = {
        api_key: 'sk-test-12345',
        organization_id: 'org-abc123',
      }
      const result = encryptCredentials(credentials)

      expect(result).toHaveProperty('encrypted')
      expect(result).toHaveProperty('iv')
    })

    it('should handle empty credentials object', () => {
      const result = encryptCredentials({})
      expect(result.encrypted).toBeTruthy()
    })

    it('should preserve all credential fields after round-trip', () => {
      const credentials = {
        api_key: 'sk-test-12345',
        secret_key: 'secret-value',
        base_url: 'https://api.example.com',
      }
      const encrypted = encryptCredentials(credentials)
      const decrypted = decryptCredentials(encrypted.encrypted, encrypted.iv)

      expect(decrypted).toEqual(credentials)
    })
  })

  describe('decryptCredentials', () => {
    it('should decrypt credentials back to original object', () => {
      const original = {
        api_key: 'sk-live-abc123',
        portal_id: '12345678',
      }
      const encrypted = encryptCredentials(original)
      const decrypted = decryptCredentials(encrypted.encrypted, encrypted.iv)

      expect(decrypted).toEqual(original)
    })

    it('should handle special characters in values', () => {
      const original = {
        api_key: 'key-with-特殊-chars-!@#$%',
        notes: 'Test with émojis 🔐🔑',
      }
      const encrypted = encryptCredentials(original)
      const decrypted = decryptCredentials(encrypted.encrypted, encrypted.iv)

      expect(decrypted).toEqual(original)
    })
  })

  describe('maskSecret', () => {
    it('should mask middle of secret with default visible chars', () => {
      const secret = 'sk-abcdefghijklmnop'
      const masked = maskSecret(secret)

      expect(masked).toBe('sk-a••••••••mnop')
      expect(masked).toContain('sk-a')
      expect(masked).toContain('mnop')
      expect(masked).toContain('••••••••')
    })

    it('should mask with custom visible chars count', () => {
      const secret = 'sk-abcdefghijklmnop'
      const masked = maskSecret(secret, 2)

      expect(masked).toBe('sk••••••••op')
    })

    it('should return placeholder for short secrets', () => {
      const shortSecret = 'abc'
      const masked = maskSecret(shortSecret)

      expect(masked).toBe('••••••••')
    })

    it('should return placeholder for empty string', () => {
      expect(maskSecret('')).toBe('••••••••')
    })

    it('should return placeholder for null/undefined', () => {
      expect(maskSecret(null as unknown as string)).toBe('••••••••')
      expect(maskSecret(undefined as unknown as string)).toBe('••••••••')
    })

    it('should handle secret exactly at threshold', () => {
      // With default visibleChars=4, threshold is 8 chars
      const exactThreshold = 'abcdefgh'
      const masked = maskSecret(exactThreshold)

      expect(masked).toBe('••••••••')
    })

    it('should handle secret just above threshold', () => {
      const aboveThreshold = 'abcdefghi' // 9 chars
      const masked = maskSecret(aboveThreshold)

      expect(masked).toBe('abcd••••••••fghi')
    })
  })

  describe('ENCRYPTION_KEY validation', () => {
    it('should throw error when ENCRYPTION_KEY is not set', () => {
      vi.stubEnv('ENCRYPTION_KEY', '')

      expect(() => {
        encryptSecret('test')
      }).toThrow('ENCRYPTION_KEY environment variable is not set')
    })

    it('should throw error when ENCRYPTION_KEY is too short', () => {
      vi.stubEnv('ENCRYPTION_KEY', 'tooshort')

      expect(() => {
        encryptSecret('test')
      }).toThrow('ENCRYPTION_KEY must be 64 hex characters')
    })

    it('should throw error when ENCRYPTION_KEY is too long', () => {
      vi.stubEnv('ENCRYPTION_KEY', 'a'.repeat(128))

      expect(() => {
        encryptSecret('test')
      }).toThrow('ENCRYPTION_KEY must be 64 hex characters')
    })

    it('should accept valid 64 hex character key', () => {
      vi.stubEnv('ENCRYPTION_KEY', '0123456789abcdef'.repeat(4))

      expect(() => {
        encryptSecret('test')
      }).not.toThrow()
    })
  })
})
