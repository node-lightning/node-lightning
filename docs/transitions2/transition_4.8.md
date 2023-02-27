## 4.8. Connected

Upon a peer connection being established we need to initiate the channel reestablish exchange as defined in [BOLT 2](https://github.com/lightning/bolts/blob/master/02-peer-protocol.md#message-retransmission). This protocol requires us to send a `channel_reestablish` message to the peer. We wait for the peer to reply with their `channel_reestablish` before we resume operation.

#### Actions:

1. Construct the `channel_reestablish` message - [`createChannelReestablishMessage` subroutine](../routines/createChannelReestablishMessage.md)
1. Send the `channel_reestablish` to the peer - [`sendMessage`](../routines/sendMessage.md)
