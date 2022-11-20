# Transitions

## 1. Send `open_channel` message

Entry state for the channel state `Connected Open`. A node initiates a channel by sending the `open_channel` message. The node must first construct the message which requires interactions with several subsystems.

#### Actions

1. Construct the `channel` - [`createChannel` subroutine]()
1. Construct the `open_channel` message - [`createOpenChannelMessage` subroutine]()
1. Send `open_channel` to peer - [`sendMessage` subroutine]()
1. Transition to the `awaiting accept_channel` state of the `Connected Open` state machine

## 2. Receive `open_channel` message

A node may receive an `open_channel` message from a peer indicating the peer wishes to fund and create a new channel. The receiving node (also called the fundee) can evaluate the `open_channel` message. The recipient can fail the channel if the parameters are not acceptable. The recipient must also fail the channel if there are certain protocol violations.

#### Condition

1. Validate the received `open_channel` message - [`validateOpenChannelMessage`]()

### 2a. Receive `open_channel` [valid]

#### Actions

1. Construct `accept_channel` message - [`createAcceptChannelMessage` subroutine]()
1. Send `accept_channel` to peer - [`sendMessage` subroutine]()

### 2b. Receive `open_channel` [invalid]

In the event that we receive a `open_channel` message that is either invalid or is not acceptable we will need to fail the channel.

#### Actions

1. Construct an `error` by providing the `temporary_channel_id` and `data` to [`createErrorMessage` subroutine]()
1. Send `error` message to peer
1. Transition to `Abandoned` channel state

## 11. Receive `accept_channel` message

After sending the `open_channel` message, the funding node must wait for the peer to reply with an `accept_channel` message. The peer replies with this message if they agree to open the channel with the rules proposed by the funder. The funder must validate the `accept_channel` message and ensure the parameters sent by the fundee are agreeable.

#### Condition

1. Validate the received `accept_channel` message by calling `validateAcceptChannelMessage` routing.

### 11a. Receive `accept_channel` [valid]

With a valid `accept_channel` message the funding node can move forward on creating the channel. The funding node moves forward by sending a `funding_created` message to the peer.

#### Actions

1. Construct `funding_created` message using `createFundingCreatedMessage` subroutine
1. Send `funding_created` to peer using `sendMessage` subroutine
1. Transition to the `Connected Open` state `awaiting funding_signed`

### 11b. Receive `accept_channel` [invalid]

Upon receipt of an invalid `accept_channel` message or one that we do not agree with, we can fail the channel.

#### Actions

1. Construct an `error` by providing the `temporary_channel_id` and `data` to `createErrorMessage`
1. Send `error` message to peer
1. Transition to `Abandoned` channel state

## 12. Disconnect

Upon disconnect, we only need to remember the channel after we have broadcast the funding transaction when we are the funder or after sending `funding_signed` as the fundee.

Prior to this, if we disconnect from the peer for any reason, we can forget the channel and try to construct the channel again once we have reconnected.

We will transition to the `Abandoned` state of the `Channel` state machine.

#### Actions

1. Transition to `Abandoned` channel state

## 13. Receive `shutdown` message

If we receive a `shutdown` message from the peer prior to broadcasting the funding transaction (as the funder) or prior to sending `funding_signed` (as the fundee) we will fail the channel, which at this stage means simply abandoning it.

#### Actions:

1. Construct an `error` by providing the `temporary_channel_id` and `data` to `createErrorMessage`
1. Send `error` message to peer
1. Transition to `Abandoned` channel state

## 21. Receive `funding_signed` message

After the opening node sends the `funding_created` message to the fundee, the opening node waits for the `funding_signed` message. This message contains the signature for the opening node's version of the commitment transaction, which enables them to spend the funding transaction into their version of the commitment transaction.

The `funding_signed` message also is the first time the real `channel_id` is used, replacing the `temporary_channel_id` that was used in prior messages.

#### Condition

1. Validate received `funding_signed` message using `validateFundingSigned` subroutine.

### 21a. Receive `funding_signed` [valid]

Upon receipt of a valid `funding_signed` message, the opening node is ready to broadcast the complete funding transaction.

Once the transaction is broadcast the funder must remember the channel. We don't provide success or failure conditions as must assume that our funding transaction is successfully broadcast since having a well connected Bitcoin node is a basic security assumption about Lightning Network.

#### Actions

1. Sign the funding transaction via the `signTx` subroutine.
1. Broadcast funding transaction using `broadcastTx` subroutine.

### 21b. Receive `funding_signed` [invalid]

Upon receipt of an invalid `funding_signed` message, the opening node will fail the channel by sending an error message and forgetting the channel.

#### Actions

1. Construct an `error` by providing the `temporary_channel_id` and `data` to the error function - [`createErrorMessage` subroutine]()
1. Send `error` message to peer - [`sendMessage` subroutine]()
1. Transition to `Abandoned` channel state

## 31. Receive `funding_created` message

After the accepting node sends `accept_channel` the opening node will reply with the `funding_created` message. This message contains the funding outpoint and includes the signature that the accepting node uses for its first commitment transaction.

#### Condition

1. Validate received `funding_created` message - [`validateFundingCreated` subroutine]()

### 31a. Receive `funding_created` [valid]

If the message is valid, the accepting node sends a `funding_signed` message to the opening node containing the signature for the opening node's commitment transaction.

#### Actions

1. Construct `funding_signed` message - [`createFundingSigned` subroutine]()
1. Send `funding_signed` message - [`sendMessage` subroutine]()

### 31b. Receive `funding_created` [invalid]

If the received message fails validation we fail the channel by sending an `error` message and forgetting the channel.

#### Actions

1. Construct an `error` by providing the `temporary_channel_id` and `data` to the error functions - [`createErrorMessage` subroutine]()
1. Send `error` message to peer - [`sendMessage` subroutine]
1. Transition to `Abandoned` channel state

## 41. Block connected [approaching expiry depth]

The fundee (accepting node) will forget the node after 2016 blocks. After 2016 blocks, if the funding transaction is confirmed, the funding node will be forced to issue a unilateral close to recover their funds. As a result of this complication, the funding node needs to ensure the function transaction is confirmed within the 2016 blocks period.

#### Condition

1. Near expiry depth (2016 blocks)

#### Actions

1. Perform fee bump via Child-Pays-For-Parent (CPFP) by calling the `feeBumpTx` subroutine.

## 42. Block connected [expiry depth reached]

For the channel acceptor (fundee) the channel can be forgotten if the funding transaction fails to confirm within 2016 blocks after initiating the channel. This creates incentive for the creator (funder) to ensure the funding transaction is confirmed or else the channel becomes invalid and the funder will need to perform a unilateral close (see 41).

#### Condition

1. Expiry depth (2016 blocks) past channel initialization

#### Actions

1. Construct an `error` by providing the `temporary_channel_id` and `data` to the error functions - [`createErrorMessage` subroutine]()
1. Send `error` message to peer - [`sendMessage` subroutine]
1. Forget the channel by transitioning to `Abandoned` channel state

## 43. Receive `channel_ready` message

A node may receive the `channel_ready` message while it is still awaiting the funding depth. This can occur because of network propagation delays for blocks, meaning your peer may reach the funding depth before you do.

#### Condition

Validate the message according to [BOLT 2](https://github.com/lightning/bolts/blob/master/02-peer-protocol.md#the-channel_ready-message).

1. Must have a valid secp256k1 point for `next_per_commitment_point`

### 43a. Receive `channel_ready` [valid]

Upon receipt of a valid `channel_ready` message we need to capture the peer's message for use during future channel operations. If there is a disconnection at the beginning of a channel the peer may send this message again, to which we can simply ignore it.

#### Actions

1. Store the `next_per_commitment_point` as received by the peer.

### 43b. Receive `channel_ready` [invalid]

Upon receipt of an invalid `channel_ready` message we transition to the `Failure` channel state.

#### Actions

1. Transition to the `Failure` channel state

## 44. Block connected [min depth reached]

The funding depth specified in `accept_channel` needs to be waited for prior to sending the `accept_channel` message. When a block connects matching the min depth, we may proceed. The min depth should consider reorganization and be larger than the max expected reorganization. As such, one the min depth is reached we can transition the channel state even if there is a subsequent reorganization.

#### Condition

1. Check if we have received a `channel_ready` message from the peer already

### 44a. Not received `channel_ready` message

If we haven't yet received a `channel_ready` message from the peer we'll need to transition to a waiting state for it. We first construct and send our `channel_ready` message to the peer.

#### Actions

1. Construct `channel_ready` message - [`createChannelReady` subroutine]()
1. Send `channel_ready` to peer - [`sendMessage` subroutine]()
1. Transition to `awaiting_channel_ready` state of the `Connected Open` channel state machine

### 44b. Received `channel_ready` message

If we did receive the `channel_ready` message we just need to construct and send our `channel_ready` message to the peer. We can begin normal channel operations!

1. Construct `channel_ready` message - [`createChannelReady` subroutine]()
1. Send `channel_ready` to peer - [`sendMessage` subroutine]()
1. Transition to `Normal` channel state

## 45. Block connected [contains funding tx]

The channel acceptor (fundee) must validate the channel creator constructed the funding transaction in an agreed upon manner. This includes validating that the outpoint spends to the correct script and that the funding amount is correct. If the create fails to construct the funding transaction correctly, the acceptor (fundee) will fail the channel.

#### Condition

We need to validate the funding transaction output, as given in `funding_txid` and `funding_output_index` of `funding_created` message is correct.

1. Validate the fudning output - [`validateFundingOutput` subroutine]()

### 45a. Funding output [valid]

If the funding output is valid we simply stay in the same state `awaiting_funding_depth` and take no further action

### 45b. Funding output [invalid]

If the funding output is invalid, we need to be sure that we do not send `channel_ready` message and can now fail the channel.

#### Actions

1. Construct an `error` by providing the `temporary_channel_id` and `data` to the error functions - [`createErrorMessage` subroutine]()
1. Send `error` message to peer - [`sendMessage` subroutine]
1. Forget the channel by transitioning to `Abandoned` channel state

## 46. Receive `shutdown` message

A peer can send a `shutdown` message after it has sent `funding_created` (opener) or `funding_signed` (acceptor). While waiting for the funding depth to be reached the peer can send the `shutdown` message. We then transition to a mutual close.

#### Actions

1. Transition to `Mutual Close` channel state

## 47. Disconnect

While waiting for the funding depth to be reach we may disconnect from the peer. We then transition to the channel state of `Disconnected Open`

## 48. Reconnected

This is an entry point into `Connected Open` that occurs when we have disconnected while waiting for the funding depth to be reached. This state occurs when we have performed a successful reconnection while in the `Disconnected Open` channel state.

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

1. Transition to the `Failure` channel state

## 52. Block connected [max depth reached]

If we do not receive a `channel_ready` message from the peer within a reasonable amount of time we can transition to a failure state.

#### Actions

1. Transition to a `Failure` channel state

## 53. Disconnect

If we disconnect while waiting for the peer's `channel_ready` message there can be some ambiguity around whether they received our `channel_ready` message which will addressed upon reconnection by always resending our `channel_ready` message.

#### Actions

1. Transition to a `Disconnected Open` channel state

## 54. Reconnected

Entry point for when we have disconnected at either `awaiting funding depth` or `awaiting channel_ready`. Once we have reconnected after going through channel reestablishment, we will resend our `channel_ready` message in case our pair failed to receive ours when we were disconnected.

#### Actions

1. Construct `channel_ready` message - [`createChannelReady` subroutine]()
1. Send `channel_ready` to peer - [`sendMessage` subroutine]()
1. Transition to `awaiting_channel_ready` state of the `Connected Open` channel state machine

## 55. Receive `shutdown` message

If we receive a `shutdown` message from the peer we will cease channel operations and move to a `Mutual Close` channel state to close the channel.

#### Actions

1. Transition to `Mutual Close` channel state
