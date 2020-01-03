// @ts-check

import BN from "bn.js";
import crypto from "crypto";
import secp256k1 from "secp256k1";

const minPrivateKey = new BN(Buffer.from("01", "hex"));
const maxPrivateKey = new BN(Buffer.from("fffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364140", "hex")); // prettier-ignore

/**
 * Returns true when the Buffer represents a 256-bit number that is between
 * 0x1 and 0xffffffffffffffffffffffffffffffffbaaedce6af48a03bbfd25e8cd0364140
 * as documented in https://en.bitcoin.it/wiki/Private_key
 *
 * @param privKey 32-byte/256-bit buffer
 */
function validPrivateKey(privKey: Buffer): boolean {
  if (!Buffer.isBuffer(privKey)) return false;
  if (privKey.length !== 32) return false;

  const val = new BN(privKey);
  return val.gte(minPrivateKey) && val.lte(maxPrivateKey);
}

/**
 * Generates a cryptographially secure 256-bit private key
 * that is valid for elliptic curve secp256k1
 *
 * @remarks This method uses crypto.randomBytes to
 * generate the random value. It may be better to use a
 * HRBG
 *
 * @returns the 32-byte/256-bit private key
 */
function createPrivateKey(): Buffer {
  let result;
  do {
    result = crypto.randomBytes(32);
  } while (!validPrivateKey);
  return result;
}

/**
 * Gets the public key in the ellitic curve secp256k1
 * from the provided private key
 *
 * @param privKey 32-byte/256-bit private key
 * @returns 33-byte buffer for compressed,
 * 65-byte buffer for uncompressed
 */
function getPublicKey(privKey: Buffer, compressed = true): Buffer {
  return secp256k1.publicKeyCreate(privKey, compressed);
}
