import { BitcoinErrorCode } from "./BitcoinErrorCode";

function getMessage(code: BitcoinErrorCode) {
    switch (code) {
        case BitcoinErrorCode.Base58ChecksumFailed:
            return "Base58Check checksum failed";
        case BitcoinErrorCode.InvalidPubKey:
            return "Invalid pubkey";
        case BitcoinErrorCode.InvalidPubKeyHash:
            return "Invalid pubkeyhash";
        default:
            return "Unknown";
    }
}

export class BitcoinError extends Error {
    constructor(readonly code: BitcoinErrorCode, readonly data?: any) {
        super(getMessage(code));
    }
}
