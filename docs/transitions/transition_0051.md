## 51. Receive `channel_ready` message

Once we have exchanged `channel_ready` messages the channel can enter normal operation. We first need to validate the the received message is valid.

#### Condition

Validate the message according to [BOLT 2](https://github.com/lightning/bolts/blob/master/02-peer-protocol.md#the-channel_ready-message).

1. Must have a valid secp256k1 point for `next_per_commitment_point`

### 51a. Receive `channel_ready` [valid]

Upon receipt of a valid `channel_ready` message we need to capture the peer's message for use during future channel operations. If there is a disconnection at the beginning of a channel the peer may send this message again, to which we can simply ignore it.

#### Actions

1. Store the `next_per_commitment_point` as received by the peer.
1. Transition to `Normal` channel state

### 51b. Receive `channel_ready` [invalid]

Upon receipt of an invalid `channel_ready` message we transition to the `Failure` channel state.

#### Actions

1. Transition to the `Failing` channel state
