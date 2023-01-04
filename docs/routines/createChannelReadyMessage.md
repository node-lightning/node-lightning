## Routing `createChannelReadyMessage`

Inputs:

-   `channel`: `Channel`

Constructs the `channel_ready` message according to [BOLT 2](https://github.com/lightning/bolts/blob/master/02-peer-protocol.md#the-channel_ready-message). Provides the second_per_commitment_point for use in local commitment transactions to allow the channel to transition to the ready state and the counter party to construct signatures for the next version of our commitment transition.
