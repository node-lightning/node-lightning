## 0.1. Send `open_channel` message

Entry state for the channel state `Connected Open`. A node initiates a channel by sending the `open_channel` message. The node must first construct the message which requires interactions with several subsystems.

#### Actions

1. Verifies that the peer is online
1. Construct the `channel` - [`createChannel` subroutine](../routines/createChannel.md)
1. Construct the `open_channel` message - [`createOpenChannelMessage` subroutine](../routines/createOpenChannelMessage.md)
1. Send `open_channel` to peer - [`sendMessage` subroutine](../routines/sendMessage.md)
1. Transition to the `awaiting accept_channel` state of the `Opening` state machine
