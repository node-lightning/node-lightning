## 11. Receive `accept_channel` message

After sending the `open_channel` message, the funding node must wait for the peer to reply with an `accept_channel` message. The peer replies with this message if they agree to open the channel with the rules proposed by the funder. The funder must validate the `accept_channel` message and ensure the parameters sent by the fundee are agreeable.

#### Condition

1. Validate the received `accept_channel` message by calling `validateAcceptChannelMessage` routing.

### 11a. Receive `accept_channel` [valid]

With a valid `accept_channel` message the funding node can move forward on creating the channel. The funding node moves forward by sending a `funding_created` message to the peer.

#### Actions

1. Construct `funding_created` message - [`createFundingCreatedMessage` subroutine]()
1. Send `funding_created` to peer - [`sendMessage` subroutine]()
1. Transition to the `Connected Open` state `awaiting funding_signed`

### 11b. Receive `accept_channel` [invalid]

Upon receipt of an invalid `accept_channel` message or one that we do not agree with, we can fail the channel.

#### Actions

1. Transition to `Failure` channel state
