import crypto from "crypto";

/**
 * HMAC-based Extact and Expand Key Derivation Function (HKDF)
 * that complies with RFC 5869
 *
 * @remarks
 * Refer to https://tools.ietf.org/html/rfc5869 for detailed information
 *
 * @param ikm initial key material, variable length
 * @param len output key material length
 * @param salt optional, defaults to none
 * @param info optional, defaults to none
 * @param hash optional, defaults to sha256
 * @returns output key material of specified length
 */
export function hkdf(
  ikm: Buffer,
  len: number,
  salt: Buffer = Buffer.alloc(0),
  info: Buffer = Buffer.alloc(0),
  hash: string = "sha256",
) {
  // extract step
  const prk = hmacHash(salt, ikm, hash);

  // expand
  const n = Math.ceil(len / prk.byteLength);
  const t = [Buffer.alloc(0)];
  for (let i = 1; i <= n; i++) {
    const tp = t[t.length - 1];
    const bi = Buffer.from([i]);
    t.push(hmacHash(prk, Buffer.concat([tp, info, bi]), hash));
  }
  return Buffer.concat(t.slice(1)).slice(0, len);
}

function hmacHash(key: Buffer, input: Buffer, hash: string) {
  const hmac = crypto.createHmac(hash, key);
  hmac.update(input);
  return hmac.digest();
}
