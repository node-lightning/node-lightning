## 43. Receive `channel_ready` message

A node may receive the `channel_ready` message while it is still awaiting the funding depth. This can occur because of network propagation delays for blocks, meaning your peer may reach the funding depth before you do.

#### Condition

Validate the message according to [BOLT 2](https://github.com/lightning/bolts/blob/master/02-peer-protocol.md#the-channel_ready-message) .

1. Must validate the `channel_ready` message by calling [`validateChannelReady` subroutine](../routines/validateChannelReady.md)

### 43a. Receive `channel_ready` [valid]

Upon receipt of a valid `channel_ready` message we need to capture the peer's message for use during future channel operations. If there is a disconnection at the beginning of a channel the peer may send this message again, to which we can simply ignore it.

#### Actions

1. Store the `next_per_commitment_point` as received by the peer by calling `attachChannelReady`.

### 43b. Receive `channel_ready` [invalid]

Upon receipt of an invalid `channel_ready` message we fail the channel.

#### Actions

1. Transition to the `Failing` channel state
