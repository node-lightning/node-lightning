import * as crypto from "@node-lightning/crypto";

export function sha256(data: Buffer): Buffer {
    return crypto.sha256(data);
}

export function ecdsaSign(
    message: Buffer,
    privKey: Buffer,
): { signature: Buffer; recovery: number } {
    return crypto.signWithRecovery(message, privKey);
}

export function ecdsaRecovery(message: Buffer, signature: Buffer, recoveryFlag: number): Buffer {
    return crypto.recoverPubKey(signature, recoveryFlag, message, true);
}

export function ecdsaVerify(pubkey: Buffer, message: Buffer, signature: Buffer): boolean {
    return crypto.verifySig(message, signature, pubkey);
}
