import chacha from "chacha-native";

/**
 * Encrypt data using authenticated encryption with associated data (AEAD)
 * ChaCha20-Poly1305.
 *
 * @param k private key, 64-bytes
 * @param n nonce, 12-bytes
 * @param ad associated data
 * @param plaintext raw data to encrypt
 * @returns encrypted data + tag as a variable length buffer
 */
export function ccpEncrypt(k: Buffer, n: Buffer, ad: Buffer, plaintext: Buffer): Buffer {
  const cipher = chacha.createCipher(k, n);
  cipher.setAAD(ad);
  // @ts-ignore
  const pad = cipher.update(plaintext);
  // @ts-ignore
  cipher.final();
  const tag = cipher.getAuthTag();

  return Buffer.concat([pad, tag]);
}

/**
 * Decrypt data uusing authenticated encryption with associated data (AEAD)
 * ChaCha20-Poly1305
 *
 * @param k private key, 64-bytes
 * @param n nonce, 12-bytes
 * @param ad associated data, variable length
 * @param ciphertext encrypted data to decrypt
 * @returns decrypteed data as a variable length Buffer
 */
export function ccpDecrypt(k: Buffer, n: Buffer, ad: Buffer, ciphertext: Buffer) {
  const decipher = chacha.createDecipher(k, n);
  decipher.setAAD(ad);

  if (ciphertext.length === 16) {
    decipher.setAuthTag(ciphertext);
    // @ts-ignore
    return decipher.final();
  }
  if (ciphertext.length > 16) {
    const tag = ciphertext.slice(ciphertext.length - 16);
    const pad = ciphertext.slice(0, ciphertext.length - 16);
    decipher.setAuthTag(tag);
    // @ts-ignore
    let m = decipher.update(pad);
    // @ts-ignore
    const f = decipher.final();
    m = Buffer.concat([m, f]);
    return m;
  }
}
