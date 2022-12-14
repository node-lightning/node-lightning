## Subroutine `signCommitmentTx`

Inputs:

-   `fundingSecret`: `PrivateKey`
-   `tx`: `TxBuilder`

Signs the commitment transaction using the `funding_secret` that was used to generate the `funding_pubkey` in either the `open_channel` or `accept_channel` message.
