export enum SigHashType {
    SIGHASH_ALL = 0x01,
    SIGHASH_NONE = 0x02,
    SIGHASH_SINGLE = 0x03,
    SIGHASH_ANYONECANPAY = 0x80,
}

export function isSigHashTypeValid(type: SigHashType) {
    if (type === SigHashType.SIGHASH_ALL) return true;
    if (type === SigHashType.SIGHASH_NONE) return true;
    if (type === SigHashType.SIGHASH_SINGLE) return true;
    if (type === (SigHashType.SIGHASH_ALL | SigHashType.SIGHASH_ANYONECANPAY)) return true;
    if (type === (SigHashType.SIGHASH_NONE | SigHashType.SIGHASH_ANYONECANPAY)) return true;
    if (type === (SigHashType.SIGHASH_SINGLE | SigHashType.SIGHASH_ANYONECANPAY)) return true;
    return false;
}
