import { describe, it, expect, beforeAll } from 'vitest'
import sodium from 'libsodium-wrappers'
import { encrypt, decrypt } from '../../security/crypto'

describe('crypto', () => {
  beforeAll(async () => {
    await sodium.ready
    const key = sodium.to_base64(
      sodium.randombytes_buf(sodium.crypto_secretbox_KEYBYTES),
      sodium.base64_variants.ORIGINAL
    )
    process.env.ENCRYPTION_KEY_B64 = key
  })

  it('encrypts and decrypts data', async () => {
    const plaintext = 'sensitive information'
    const ciphertext = await encrypt(plaintext)
    expect(ciphertext).not.toBe(plaintext)
    const decrypted = await decrypt(ciphertext)
    expect(decrypted).toBe(plaintext)
  })
})
