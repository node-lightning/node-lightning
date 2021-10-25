export enum BitcoinErrorCode {
    InvalidPrivateKey,
    Base58ChecksumFailed,
    PubKeyInvalid,
    PubKeyHashInvalid,
    SigEncodingInvalid,
    SigHashTypeInvalid,
    MultiSigSetupInvalid,
    Hash160Invalid,
    Hash256Invalid,
    NetworkMismatch,

    // HD Key Related
    InvalidHdEncoding,
    IncorrectKeyVersion,
    InvalidHdPath,
    InvalidHdDerivation,
    InvalidHdPrivateKey,
    InvalidHdPublicKey,
    UnkownHdKeyVersion,

    // bech32
    InvalidBech32Encoding,
    InvalidBech32Hrp,
    InvalidBech32Checksum,

    // addresses
    UnknownAddressPrefix,
    InvalidSegwitVersion,
    InvalidWitnessProgram,

    // mnemonics
    InvalidMnemonicWordList,
    InvalidMnemonicEntropy,
    InvalidMnemonicWord,
    InvalidMnemonicChecksum,
}
