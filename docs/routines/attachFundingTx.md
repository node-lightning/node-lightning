## Subroutine `attachFundingTx`

Inputs:

-   `channel`: `Channel`
-   `fundingTx`: `Tx`

Helper used by the funder to attach the funding transaction and funding outpoint in one pass. This will also populate the `channel_id` which will be used when the `funding_signed` message is received.
