import sodium from 'libsodium-wrappers'

/**
 * Encrypt a JSON-serializable payload using libsodium secretbox.
 * Returns a base64 encoded nonce and cipher separated by a colon.
 */
export async function encryptJson(payload: unknown): Promise<string> {
  await sodium.ready
  const keyB64 = process.env.ENCRYPTION_KEY_B64
  if (!keyB64) {
    throw new Error('ENCRYPTION_KEY_B64 missing')
  }
  const key = sodium.from_base64(keyB64, sodium.base64_variants.ORIGINAL)
  const nonce = sodium.randombytes_buf(sodium.crypto_secretbox_NONCEBYTES)
  const message = sodium.from_string(JSON.stringify(payload))
  const cipher = sodium.crypto_secretbox_easy(message, nonce, key)
  return `${sodium.to_base64(nonce, sodium.base64_variants.ORIGINAL)}:${sodium.to_base64(cipher, sodium.base64_variants.ORIGINAL)}`
}
