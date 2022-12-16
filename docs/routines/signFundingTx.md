## Subroutine `signFundingTx`

Inputs:

-   `fundingTx`: `TxBuilder`

Used by the funder. This method accepts a completed funding transaction as an argument. The funder's on-chain wallet will known how to sign this transaction based on the used UTXOs and will perform the appropriate signing and input configurations. The wallet should return an immutable and broadcastable transaction.
