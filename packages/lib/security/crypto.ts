import sodium from 'libsodium-wrappers'

const ENCRYPTION_KEY_B64 = process.env.ENCRYPTION_KEY_B64

if (!ENCRYPTION_KEY_B64) {
  throw new Error('ENCRYPTION_KEY_B64 environment variable is required')
}

export async function initSodium() {
  await sodium.ready
}

export function encryptJSON(data: any): string {
  if (!ENCRYPTION_KEY_B64) {
    throw new Error('ENCRYPTION_KEY_B64 not configured')
  }
  
  const key = sodium.from_base64(ENCRYPTION_KEY_B64)
  const nonce = sodium.randombytes_buf(sodium.crypto_secretbox_NONCEBYTES)
  const plaintext = sodium.from_string(JSON.stringify(data))
  
  const ciphertext = sodium.crypto_secretbox_easy(plaintext, nonce, key)
  
  return sodium.to_base64(nonce) + ':' + sodium.to_base64(ciphertext)
}

export function decryptJSON(encryptedData: string): any {
  if (!ENCRYPTION_KEY_B64) {
    throw new Error('ENCRYPTION_KEY_B64 not configured')
  }
  
  const [nonceB64, ciphertextB64] = encryptedData.split(':')
  if (!nonceB64 || !ciphertextB64) {
    throw new Error('Invalid encrypted data format')
  }
  
  const key = sodium.from_base64(ENCRYPTION_KEY_B64)
  const nonce = sodium.from_base64(nonceB64)
  const ciphertext = sodium.from_base64(ciphertextB64)
  
  try {
    const plaintext = sodium.crypto_secretbox_open_easy(ciphertext, nonce, key)
    return JSON.parse(sodium.to_string(plaintext))
  } catch (error) {
    throw new Error('Failed to decrypt data')
  }
}