import { BitcoinErrorCode } from "./BitcoinErrorCode";

function getMessage(code: BitcoinErrorCode) {
    switch (code) {
        case BitcoinErrorCode.InvalidPrivateKey:
            return "Invalid private key";
        case BitcoinErrorCode.Base58ChecksumFailed:
            return "Base58Check checksum failed";
        case BitcoinErrorCode.PubKeyInvalid:
            return "Invalid public key";
        case BitcoinErrorCode.PubKeyHashInvalid:
            return "Invalid pubkeyhash";
        case BitcoinErrorCode.SigEncodingInvalid:
            return "Signatures requires BIP66 DER encoding";
        case BitcoinErrorCode.SigHashTypeInvalid:
            return "Invalid Signature SIGHASH type";
        case BitcoinErrorCode.MultiSigSetupInvalid:
            return "MultiSig structure is invalid";
        case BitcoinErrorCode.Hash160Invalid:
            return "Hash160 requires 20-byte Buffer";
        case BitcoinErrorCode.Hash256Invalid:
            return "Hash256 requires 32-byte Buffer";
        case BitcoinErrorCode.NetworkMismatch:
            return "Network mismatch";
        case BitcoinErrorCode.InputIndexOutOfRange:
            return "Input index out of range";

        case BitcoinErrorCode.UnkownHdKeyVersion:
            return "Unkown HD key version";
        case BitcoinErrorCode.InvalidHdEncoding:
            return "Invalid HD encoding";
        case BitcoinErrorCode.InvalidHdPath:
            return "Invalid HD key path";
        case BitcoinErrorCode.InvalidHdDerivation:
            return "Invalid HD key derivation";
        case BitcoinErrorCode.InvalidHdPrivateKey:
            return "Invalid HD private key";
        case BitcoinErrorCode.InvalidHdPublicKey:
            return "Invalid HD public key";

        case BitcoinErrorCode.InvalidBech32Encoding:
            return "Invalid bech32 encoding";
        case BitcoinErrorCode.InvalidBech32Hrp:
            return "Invalid bech32 human readable part";
        case BitcoinErrorCode.InvalidBech32Checksum:
            return "Invalid bech32 checksum";

        case BitcoinErrorCode.UnknownAddressPrefix:
            return "Unknown address prefix";
        case BitcoinErrorCode.InvalidSegwitVersion:
            return "Unknown segwit version";
        case BitcoinErrorCode.InvalidWitnessProgram:
            return "Invalid witness program";

        case BitcoinErrorCode.InvalidMnemonicWordList:
            return "Invalid mnemonic word list";
        case BitcoinErrorCode.InvalidMnemonicEntropy:
            return "Invalid mnemonic entropy";
        case BitcoinErrorCode.InvalidMnemonicWord:
            return "Unknown mnemonic word";
        case BitcoinErrorCode.InvalidMnemonicChecksum:
            return "Mnemonic checksum failed";

        case BitcoinErrorCode.InvalidWifEncoding:
            return "Invalid WIF encoding";
        case BitcoinErrorCode.UnknownWifPrefix:
            return "Unknown WIF prefix";

        case BitcoinErrorCode.ValueUnderflow:
            return "Value underflow";

        case BitcoinErrorCode.GenesisHashNotDefined:
            return "Genesis hash not set";
    }
}

export class BitcoinError extends Error {
    constructor(readonly code: BitcoinErrorCode, readonly info?: any) {
        super(getMessage(code));
        this.name = "BitcoinError";
    }
}
