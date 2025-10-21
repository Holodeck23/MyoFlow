type SodiumModule = typeof import('libsodium-wrappers')

let sodiumInstance: SodiumModule | null = null
let sodiumInitPromise: Promise<SodiumModule> | null = null
let key: Uint8Array | null = null

async function getSodium(): Promise<SodiumModule> {
  if (sodiumInstance) {
    return sodiumInstance
  }

  if (!sodiumInitPromise) {
    sodiumInitPromise = import('libsodium-wrappers').then(async (module) => {
      const sodium = module.default ?? module
      await sodium.ready
      sodiumInstance = sodium
      return sodium
    })
  }

  return sodiumInitPromise
}

async function getKey(): Promise<Uint8Array> {
  const sodium = await getSodium()
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
  const sodium = await getSodium()
  const k = await getKey()
  const nonce = sodium.randombytes_buf(sodium.crypto_secretbox_NONCEBYTES)
  // libsodium requires Uint8Array input; convert string to bytes explicitly
  const message = sodium.from_string(plainText)
  const cipher = sodium.crypto_secretbox_easy(message, nonce, k)
  return [
    sodium.to_base64(nonce, sodium.base64_variants.ORIGINAL),
    sodium.to_base64(cipher, sodium.base64_variants.ORIGINAL)
  ].join(':')
}

export async function decryptString(payload: string): Promise<string> {
  const sodium = await getSodium()
  const k = await getKey()
  const [nonceB64, cipherB64] = payload.split(':')
  const nonce = sodium.from_base64(nonceB64, sodium.base64_variants.ORIGINAL)
  const cipher = sodium.from_base64(cipherB64, sodium.base64_variants.ORIGINAL)
  const plain = sodium.crypto_secretbox_open_easy(cipher, nonce, k)
  return sodium.to_string(plain)
}

export async function encryptJson(data: any): Promise<string> {
  return encryptString(JSON.stringify(data))
}

export async function decryptJson<T = any>(payload: string): Promise<T> {
  const decrypted = await decryptString(payload)
  return JSON.parse(decrypted) as T
}
