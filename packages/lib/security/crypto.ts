import sodium from 'libsodium-wrappers'

let key: Uint8Array | null = null

async function getKey(): Promise<Uint8Array> {
  await sodium.ready
  if (key) return key
  const keyB64 = process.env.ENCRYPTION_KEY_B64
  if (!keyB64) {
    throw new Error('ENCRYPTION_KEY_B64 is not set')
  }
  key = sodium.from_base64(keyB64, sodium.base64_variants.ORIGINAL)
  if (key.length !== sodium.crypto_secretbox_KEYBYTES) {
    throw new Error('Invalid encryption key length')
  }
  return key
}

export async function encrypt(plaintext: string): Promise<string> {
  const k = await getKey()
  const nonce = sodium.randombytes_buf(sodium.crypto_secretbox_NONCEBYTES)
  const messageBytes = sodium.from_string(plaintext)
  const cipher = sodium.crypto_secretbox_easy(messageBytes, nonce, k)
  const nonceB64 = sodium.to_base64(nonce, sodium.base64_variants.ORIGINAL)
  const cipherB64 = sodium.to_base64(cipher, sodium.base64_variants.ORIGINAL)
  return `${nonceB64}:${cipherB64}`
}

export async function decrypt(payload: string): Promise<string> {
  const k = await getKey()
  const [nonceB64, cipherB64] = payload.split(':')
  const nonce = sodium.from_base64(nonceB64, sodium.base64_variants.ORIGINAL)
  const cipher = sodium.from_base64(cipherB64, sodium.base64_variants.ORIGINAL)
  const message = sodium.crypto_secretbox_open_easy(cipher, nonce, k)
  return sodium.to_string(message)
}
