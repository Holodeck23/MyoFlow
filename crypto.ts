import sodium from 'libsodium-wrappers';

let encryptionKey: Uint8Array;

async function getKey(): Promise<Uint8Array> {
  if (encryptionKey) return encryptionKey;

  const keyB64 = process.env.ENCRYPTION_KEY_B64;
  if (!keyB64) {
    throw new Error('ENCRYPTION_KEY_B64 is not set in environment variables.');
  }
  await sodium.ready;
  encryptionKey = sodium.from_base64(keyB64, sodium.base64_variants.ORIGINAL);
  return encryptionKey;
}

/**
 * Encrypts a JSON-serializable object.
 * @returns A base64 string in the format "nonce:ciphertext".
 */
export async function encryptJson(payload: object): Promise<string> {
  const key = await getKey();
  const nonce = sodium.randombytes_buf(sodium.crypto_secretbox_NONCEBYTES);
  const message = JSON.stringify(payload);

  const ciphertext = sodium.crypto_secretbox_easy(message, nonce, key);

  const nonceB64 = sodium.to_base64(nonce, sodium.base64_variants.URLSAFE_NO_PADDING);
  const cipherB64 = sodium.to_base64(ciphertext, sodium.base64_variants.URLSAFE_NO_PADDING);

  return `${nonceB64}:${cipherB64}`;
}

/**
 * Decrypts a "nonce:ciphertext" string back into an object.
 */
export async function decryptJson<T>(encrypted: string): Promise<T> {
  const key = await getKey();
  const [nonceB64, cipherB64] = encrypted.split(':');

  if (!nonceB64 || !cipherB64) {
    throw new Error('Invalid encrypted format. Expected "nonce:ciphertext".');
  }

  const nonce = sodium.from_base64(nonceB64, sodium.base64_variants.URLSAFE_NO_PADDING);
  const ciphertext = sodium.from_base64(cipherB64, sodium.base64_variants.URLSAFE_NO_PADDING);

  const decryptedMessage = sodium.crypto_secretbox_open_easy(ciphertext, nonce, key);

  return JSON.parse(sodium.to_string(decryptedMessage)) as T;
}

