## 4.10. Block connected [min depth reached]

The funding depth specified in `accept_channel` needs to be waited for prior to sending the `accept_channel` message. When a block connects matching the min depth, we may proceed. The min depth should consider reorganization and be larger than the max expected reorganization. As such, one the min depth is reached we can transition the channel state even if there is a subsequent reorganization.

We may be in a variety of states depending on the connection status and if we have received the `channel_ready` message from the peer already.

#### States

### 4.10.a. Connected to Peer

Now that we have reached depth we will construct and send our `channel_ready` message to the peer. We will transition to different states depending if we have already received a `channel_ready` message from the peer.

#### Actions

1. Construct `channel_ready` message - [`createChannelReadyMessage` subroutine](../routines/createChannelReadyMessage.md)
1. Send `channel_ready` to peer - [`sendMessage` subroutine](../routines/sendMessage.md)

### 4.10.b. Disconnected

Since we are disconnected we will be unable to send the `channel_ready` message to the peer. We will need to wait until we reconnect to perform that action.

If we haven't yet received a `channel_ready` message from the peer we'll need to transition to a waiting state for it. Since we are disconnected we cannot send our version of `channel_ready` but we will always perform that action upon disconnection. We take no further action but should account for the fact that we will send this message in our state transition.
