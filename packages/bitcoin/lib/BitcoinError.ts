import { BitcoinErrorCode } from "./BitcoinErrorCode";

function getMessage(code: BitcoinErrorCode) {
    switch (code) {
        default:
            return "Unknown";
    }
}

export class BitcoinError extends Error {
    constructor(readonly code: BitcoinErrorCode, readonly data?: any) {
        super(getMessage(code));
    }
}
