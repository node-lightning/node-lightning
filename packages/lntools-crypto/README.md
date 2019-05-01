# @lntools/crypto

This package provides cryptographic functions for use in LN Tools:

- sha256
- hash160
- hkdf
- secp256k1 ECDH
- secp256k1 private key generation
- secp256k1 public key derivation
- chacha20-poly1305 AEAD

This library uses the native Node.js crypto and C++ versions of third party secp256k1 and chacha20-poly1305 libraries. This module is not browser compatible.
