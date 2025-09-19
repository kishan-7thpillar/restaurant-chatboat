import CryptoJS from 'crypto-js'

// Secret key for encryption/decryption (in production, this should be an environment variable)
const SECRET_KEY = 'restaurant-ai-secret-key-2024'

/**
 * Encrypts an API key using AES encryption
 */
export function encryptApiKey(apiKey: string): string {
  if (!apiKey) return ''
  return CryptoJS.AES.encrypt(apiKey, SECRET_KEY).toString()
}

/**
 * Decrypts an encrypted API key
 */
export function decryptApiKey(encryptedKey: string): string {
  if (!encryptedKey) return ''
  try {
    const bytes = CryptoJS.AES.decrypt(encryptedKey, SECRET_KEY)
    return bytes.toString(CryptoJS.enc.Utf8)
  } catch (error) {
    console.error('Failed to decrypt API key:', error)
    return ''
  }
}

/**
 * Masks an API key for display purposes (shows only first 4 and last 4 characters)
 */
export function maskApiKey(apiKey: string): string {
  if (!apiKey || apiKey.length < 8) return '••••••••'
  return `${apiKey.slice(0, 4)}${'•'.repeat(apiKey.length - 8)}${apiKey.slice(-4)}`
}
