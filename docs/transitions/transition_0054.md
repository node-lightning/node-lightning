## 54. Reconnected

Entry point for when we have disconnected at either `awaiting funding depth` or `awaiting channel_ready`. Once we have reconnected after going through channel reestablishment, we will resend our `channel_ready` message in case our pair failed to receive ours when we were disconnected.

#### Actions

1. Construct `channel_ready` message - [`createChannelReady` subroutine](../routines/createChannelReady.md)
1. Send `channel_ready` to peer - [`sendMessage` subroutine](../routines/sendMessage.md)
1. Transition to `awaiting_channel_ready` state of the `Connected Open` channel state machine
