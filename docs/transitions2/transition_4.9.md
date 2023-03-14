## 4.9. Receive `channel_reestablish` message

Upon receipt of a `channel_reestablish` message we take several actions according to the evaluation of the [BOLT 2](https://github.com/lightning/bolts/blob/master/02-peer-protocol.md#message-retransmission) message.

#### Condition

We need to evaluate the `channel_reestablish` message from the

1. Evaluate the `channel_reestablish` message - [`evaluateChannelReestablishMessage` subroutine](../routines/evaluateChannelReestablishMessage.md)

### 4.9.a. `channel_reestablish` [Valid]

The `channel_reestablish` is pretty boring at this point in the game. So we should be fine to transition back to a connected state

### 4.9.b. `channel_reestablish` [Invalid]

If `channel_reestablish` fails validation or contains unexpected values at this point we will need to fail the channel.

### 4.9.c. `channel_reestablish` [Valid]

After we have reached the funding depth, upon successfully validating `channel_reestablishment` we should send our `channel_ready` message.

#### Actions

1. Construct `channel_ready` message - [`createChannelReadyMessage` subroutine](../routines/createChannelReadyMessage.md)
1. Send `channel_ready` to peer - [`sendMessage` subroutine](../routines/sendMessage.md)
