import HKDF from "futoin-hkdf";

/**
 * HMAC-based Extact and Expand Key Derivation Function (HKDF)
 * using SHA-256 and returning a 64-byte buffer.
 *
 * @param salt salt, variable length
 * @param ikm initial key material, variable length
 * @returns 64-byte buffer
 */
export function hkdf(salt: Buffer, ikm: Buffer): Buffer {
  // @ts-ignore
  return HKDF(ikm, 64, { salt, hash: "SHA-256" });
}
