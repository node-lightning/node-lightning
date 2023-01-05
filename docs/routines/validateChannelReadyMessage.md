## Subroutine `validateChannelReadyMessage`

Inputs:

-   `channel`: `Channel`
-   `msg`: `ChannelReadyMessage`

Validate the message according to [BOLT 2](https://github.com/lightning/bolts/blob/master/02-peer-protocol.md#the-channel_ready-message).

1. Must have a valid secp256k1 point for `next_per_commitment_point`
