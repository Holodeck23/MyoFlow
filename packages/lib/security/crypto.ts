import sodium from 'libsodium-wrappers'

let key: Uint8Array | null = null

async function getKey(): Promise<Uint8Array> {
  await sodium.ready
  if (!key) {
    const keyB64 = process.env.ENCRYPTION_KEY_B64
    if (!keyB64) {
      throw new Error('ENCRYPTION_KEY_B64 not set')
    }
    key = sodium.from_base64(keyB64, sodium.base64_variants.ORIGINAL)
  }
  return key
}

export async function encryptString(plainText: string): Promise<string> {
  const k = await getKey()
  const nonce = sodium.randombytes_buf(sodium.crypto_secretbox_NONCEBYTES)
  const cipher = sodium.crypto_secretbox_easy(plainText, nonce, k)
  return [
    sodium.to_base64(nonce, sodium.base64_variants.ORIGINAL),
    sodium.to_base64(cipher, sodium.base64_variants.ORIGINAL)
  ].join(':')
}

export async function decryptString(payload: string): Promise<string> {
  const k = await getKey()
  const [nonceB64, cipherB64] = payload.split(':')
  const nonce = sodium.from_base64(nonceB64, sodium.base64_variants.ORIGINAL)
  const cipher = sodium.from_base64(cipherB64, sodium.base64_variants.ORIGINAL)
  const plain = sodium.crypto_secretbox_open_easy(cipher, nonce, k)
  return sodium.to_string(plain)
}
