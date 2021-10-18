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
}
