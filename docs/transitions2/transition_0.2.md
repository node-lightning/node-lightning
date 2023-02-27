## 0.2. Receive `open_channel` message

A node may receive an `open_channel` message from a peer indicating the peer wishes to fund and create a new channel. The receiving node (also called the fundee) can evaluate the `open_channel` message. The recipient can fail the channel if the parameters are not acceptable. The recipient must also fail the channel if there are certain protocol violations.

#### Condition

1. Validate the received `open_channel` message - [`validateOpenChannelMessage`]()

### 0.2.a. Receive `open_channel` [valid]

#### Actions

1. Construct `accept_channel` message - [`createAcceptChannelMessage` subroutine](../routines/createAcceptChannelMessage.md)
1. Send `accept_channel` to peer - [`sendMessage` subroutine](../routines/sendMessage.md)

### 0.2.b. Receive `open_channel` [invalid]

In the event that we receive a `open_channel` message that is either invalid or is not acceptable we will need to fail the channel.

#### Actions

1. Transition to `Failing` channel state
