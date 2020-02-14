import HKDF from "futoin-hkdf";

/**
 * HMAC-based Extact and Expand Key Derivation Function (HKDF)
 * using SHA-256 and returning a 64-byte buffer.
 *
 * @param ikm initial key material, variable length
 * @param len output key material length
 * @param salt optional, defaults to none
 * @param info optional, defaults to none
 * @param hash optional, defaults to sha256
 * @param salt salt, variable length
 * @returns 64-byte buffer
 */
export function hkdf(
  ikm: Buffer,
  len: number = 64,
  salt: Buffer = Buffer.alloc(0),
  info: Buffer = Buffer.alloc(0),
  hash: string = "sha256",
): Buffer {
  // @ts-ignore
  return HKDF(ikm, len, { salt, hash, info });
}
