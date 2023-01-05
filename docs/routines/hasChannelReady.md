## Subrouting `hasChannelReady`

Inputs:

-   `channel`: `Channel`

Returns true when we have received the `channel_ready` message from the peer. This will be evident from the peer's side of the channel having a nextCommitmentNumber > 0.
