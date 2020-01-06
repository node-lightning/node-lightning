import crypto from "crypto";
import secp256k1 from "secp256k1";

export function sha256(data: Buffer): Buffer {
  const hash = crypto.createHash("sha256");
  hash.update(data);
  return hash.digest();
}

export function ecdsaSign(
  message: Buffer,
  privKey: Buffer,
): { signature: Buffer; recovery: number } {
  return secp256k1.sign(message, privKey);
}

export function ecdsaRecovery(message: Buffer, signature: Buffer, recoveryFlag: number): Buffer {
  return secp256k1.recover(message, signature, recoveryFlag, true);
}

export function ecdsaVerify(pubkey: Buffer, message: Buffer, signature: Buffer): boolean {
  return secp256k1.verify(message, signature, pubkey);
}
