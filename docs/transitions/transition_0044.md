## 44. Block connected [min depth reached]

The funding depth specified in `accept_channel` needs to be waited for prior to sending the `accept_channel` message. When a block connects matching the min depth, we may proceed. The min depth should consider reorganization and be larger than the max expected reorganization. As such, one the min depth is reached we can transition the channel state even if there is a subsequent reorganization.

#### Condition

1. Check if we have received a `channel_ready` message from the peer already

### 44a. Not received `channel_ready` message - Connected

If we haven't yet received a `channel_ready` message from the peer we'll need to transition to a waiting state for it. We first construct and send our `channel_ready` message to the peer.

#### Actions

1. Construct `channel_ready` message - [`createChannelReadyMessage` subroutine](../routines/createChannelReadyMessage.md)
1. Send `channel_ready` to peer - [`sendMessage` subroutine](../routines/sendMessage.md)
1. Transition to `awaiting_channel_ready` state of the `Connected Open` channel state machine

### 44b. Received `channel_ready` message - Connected

If we did receive the `channel_ready` message we just need to construct and send our `channel_ready` message to the peer. We can begin normal channel operations!

1. Construct `channel_ready` message - [`createChannelReadyMessage` subroutine](../routines/createChannelReadyMessage.md)
1. Send `channel_ready` to peer - [`sendMessage` subroutine](../routines/sendMessage.md)
1. Transition to `Normal` channel state

### 44c. Received `channel_ready` message - Disconnected state

If we haven't yet received a `channel_ready` message from the peer we'll need to transition to a waiting state for it. Since we are disconnected we cannot send our version of `channel_ready` but we will always perform that action upon disconnection.

#### Actions

1. Transition to `Disconnected Normal` channel state

### 44d. Not received `channel_ready` message - Disconnected state

If we haven't yet received a `channel_ready` message from the peer we'll need to transition to a waiting state for it. Since we are disconnected we cannot send our version of `channel_ready` but we will always perform that action upon disconnection.

#### Actions

1. Transition to `awaiting_channel_ready` state of the `Disconnected Open` channel state machine
1. Set return state to `awaiting_channel_ready`
