## Subroutine `createFundingCreatedMessage`

Inputs:

-   `Channel`
-   `signature`: `Buffer`

Calls:

Once the funding node has created and signed the commitment transaction it can construct the `funding_created` message to send to the peer. This method constructs a `funding_created` message as defined in [BOLT 2](https://github.com/lightning/bolts/blob/master/02-peer-protocol.md#the-funding_created-message).

1. Must set the `temporary_channel_id` to the same as that in the `open_channel` message
1. Must set the `funding_txid` to the funding transaction id
1. Must not broadcast the funding transaction
1. Must set the `funding_output_index` to the output number of that transaction that corresponds
1. Must set the `signature` to the valid signature using the `funding_pubkey` from `open_channel` of the fundee's version of the first commitment transaction
