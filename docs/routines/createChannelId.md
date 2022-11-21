## Subroutine `createChannelId`

Inputs:

-   `funding_outpoint`

Constructs the `channel_id` from the funding UTXO as defined in [BOLT 2](https://github.com/lightning/bolts/blob/master/02-peer-protocol.md#the-funding_signed-message).

`channel_id` is defined as the XOR of `funding_txid` and `funding_output_index` from the outpoint sent in the `funding_created` message.
