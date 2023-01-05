## Subroutine `validateFundingTx`

Inputs:

-   `channel`: `Channel`
-   `fundingTx`: `Tx`

Calls:

-   `createFundingOutput`

When the funding transaction is confirmed on-chain, we need to validate that the expected outpoint and script. In [BOLT 2](https://github.com/lightning/bolts/blob/master/02-peer-protocol.md#the-channel_ready-message), prior to sending a `channel_ready` message we need to validate that the funding transaction corresponds to the expected channel creation. We do this by verifying:

1. The output pays exactly `funding_satoshis`
1. The output pays to the scriptpubkey established in BOLT 3 for the funding transaction by calling `createFundingOutput`
