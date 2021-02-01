import { BitcoinErrorCode } from "./BitcoinErrorCode";

function getMessage(code: BitcoinErrorCode) {
    switch (code) {
        case BitcoinErrorCode.Base58ChecksumFailed:
            return "Base58Check checksum failed";
        case BitcoinErrorCode.PubKeyInvalid:
            return "Invalid pubkey";
        case BitcoinErrorCode.PubKeyHashInvalid:
            return "Invalid pubkeyhash";
        case BitcoinErrorCode.SigEncodingInvalid:
            return "Signatures requires BIP66 DER encoding";
        case BitcoinErrorCode.SigHashTypeInvalid:
            return "Invalid Signature SIGHASH type";
        default:
            return "Unknown";
    }
}

export class BitcoinError extends Error {
    constructor(readonly code: BitcoinErrorCode, readonly data?: any) {
        super(getMessage(code));
    }
}
