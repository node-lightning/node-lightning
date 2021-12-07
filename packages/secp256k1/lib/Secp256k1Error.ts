export enum Secp256k1Error {
    IMPOSSIBLE_CASE = "Impossible case. Please create issue.",
    TWEAK_ADD = "The tweak was out of range or the resulted private key is invalid",
    TWEAK_MUL = "The tweak was out of range or equal to zero",
    CONTEXT_RANDOMIZE_UNKNOW = "Unknow error on context randomization",
    SECKEY_INVALID = "Private Key is invalid",
    PUBKEY_PARSE = "Public Key could not be parsed",
    PUBKEY_SERIALIZE = "Public Key serialization error",
    PUBKEY_COMBINE = "The sum of the public keys is not valid",
    SIG_PARSE = "Signature could not be parsed",
    SIGN = "The nonce generation function failed, or the private key was invalid",
    RECOVER = "Public key could not be recover",
    ECDH = "Scalar was invalid (zero or overflow)",
}
