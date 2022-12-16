## Routine `validateCommitmentSig`

Inputs:

-   `channel`: `Channel`
-   `ctx`: `TxBuilder`
-   `sig`: `Buffer`
-   `pubkey`: `PublicKey`

Performs ECDSA signature verification of the funding input for the
commitment transaction. Fails if the signature is invalid for the public
key or if the signature is not a low-S signature.
