## 61. Receive `channel_reestablish` message

Upon receipt of a `channel_reestablish` message we take several actions according to the evaluation of the [BOLT 2](https://github.com/lightning/bolts/blob/master/02-peer-protocol.md#message-retransmission) message.

#### Condition

We need to evaluate the `channel_reestablish` message from the

1. Evaluate the `channel_reestablish` message - [`evaluateChannelReestablishMessage` subroutine](../routines/evaluateChannelReestablishMessage.md)

### 61a. `channel_reestablish` [OK]

The `channel_reestablish` is pretty boring at this point in the game. So we should be fine to transition back to the `Connected Open` channel state at the specified reestablishment state.

#### Actions

1. Transition to `Connected Open` channel state at the captured reestablishment entry point (`awaiting_funding_depth` or `awaiting_channel_ready`).

### 61b. `channel_reestablish` [Invalid]

If `channel_reestablish` fails validation or contains unexpected values at this point we will need to fail the channel.

#### Actions

1. Transition to `Failing` channel state
