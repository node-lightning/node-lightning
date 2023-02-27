## 2.1. Receive `funding_signed` message

After the opening node sends the `funding_created` message to the fundee, the opening node waits for the `funding_signed` message. This message contains the signature for the opening node's version of the commitment transaction, which enables them to spend the funding transaction into their version of the commitment transaction.

The `funding_signed` message also is the first time the real `channel_id` is used, replacing the `temporary_channel_id` that was used in prior messages.

#### Condition

1. Validate received `funding_signed` message - [`validateFundingSignedMessage` subroutine](../routines/validateFundingSignedMessage.md)

### 2.1.a. Receive `funding_signed` [valid]

Upon receipt of a valid `funding_signed` message, the opening node is ready to broadcast the complete funding transaction.

Once the transaction is broadcast the funder must remember the channel. We don't provide success or failure conditions as must assume that our funding transaction is successfully broadcast since having a well connected Bitcoin node is a basic security assumption about Lightning Network.

#### Actions

1. Attach `funding_signed` information to `channel` - [`attachFundingSigned`](../routines/attachFundingSigned.md)
1. Broadcast funding transaction - [`broadcastTx` subroutine](../routines/broadcastTx.md)
1. Transition to `AwaitingFundingDepth` channel state

### 2.1.b . Receive `funding_signed` [invalid]

Upon receipt of an invalid `funding_signed` message, the opening node will fail the channel by sending an error message and forgetting the channel.

#### Actions

1. Transition to `Failing` channel state
