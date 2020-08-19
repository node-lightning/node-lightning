# @node-lightning/crypto

This packages uses the native Node.js crypto for all functionality except secp256k1. This package requires Node.js 10.17+.

This package provides cryptographic functions for use in LN Tools:

-   sha256
-   hash160
-   hkdf
-   secp256k1 ECDH
-   secp256k1 private key generation
-   secp256k1 public key derivation
-   chacha20-poly1305 AEAD
