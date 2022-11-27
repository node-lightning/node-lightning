## 31. Receive `funding_created` message

After the accepting node sends `accept_channel` the opening node will reply with the `funding_created` message. This message contains the funding outpoint and includes the signature that the accepting node uses for its first commitment transaction.

#### Condition

1. Validate received `funding_created` message - [`validateFundingCreatedMessage` subroutine](../routines/validatefundingCreatedMessage.md)

### 31a. Receive `funding_created` [valid]

If the message is valid, the accepting node sends a `funding_signed` message to the opening node containing the signature for the opening node's commitment transaction.

#### Actions

1. Construct `funding_signed` message - [`createFundingSignedMessage` subroutine](../routines/createFundingSignedMessage.md)
1. Send `funding_signed` message - [`sendMessage` subroutine](../routines/sendMessage.md)

### 31b. Receive `funding_created` [invalid]

If the received message fails validation we fail the channel by sending an `error` message and forgetting the channel.

#### Actions

1. Transition to `Failing` channel state
