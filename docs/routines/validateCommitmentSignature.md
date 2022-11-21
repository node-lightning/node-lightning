## Subroutine `validateCommitmentSignature`

Validates a commitment transaction signature and retruns false if the signature is invalid

Inputs:

-   Commitment transaction
-   Signature
-   Public key

1. Returns false if `signature` is not the valid signature for the transaction
1. Returns false if `signature` is not the low-S standard rule from BIP146
