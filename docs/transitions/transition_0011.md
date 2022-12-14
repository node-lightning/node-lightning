## 11. Receive `accept_channel` message

After sending the `open_channel` message, the funding node must wait for the peer to reply with an `accept_channel` message. The peer replies with this message if they agree to open the channel with the rules proposed by the funder. The funder must validate the `accept_channel` message and ensure the parameters sent by the fundee are agreeable.

#### Condition

1. Validate the received `accept_channel` message - [`validateAcceptChannelMessage` routine](../routines/validateAcceptChannelMessage.md)

### 11a. Receive `accept_channel` [valid]

With a valid `accept_channel` message the funding node can move forward on creating the channel. The funding node moves forward by sending a `funding_created` message to the peer.

#### Actions

1. Construct the funding transaction using the [`createFundingTx` subroutine](../routines/createFundingTx.md)
1. Construct the first commitment transaction so that we can provide the signature to the fundee by calling [`createRemoteCommitmentTx` subroutine](../routines/createRemoteCommitmentTx.md) using channel values

    - Commitment number = 0
    - Local as the funding node
    - Channel `funding_outpoint` created in prior step
    - Channel `feerate_per_kw` we sent in `open_channel`
    - Counterparty's `dust_limit_satoshis` we received in `accept_channel`
    - Counterparty's balance which will be `push_msat` / 1000 from `open_channel`
    - Our balance which will be `funding_satoshis` less `push_msat` / 1000
    - Counterparty's `to_self_delay` we sent in `open_channel`
    - Counterparty's `per_commitment_point` we received as `first_per_commitment_point` in `accept_channel`
    - Counterparty's `delayed_payment_basepoint` we received in `accept_channel`
    - Our `payment_basepoint` we sent in `open_channel`
    - Our `revocation_basepoint` we sent in `open_channel`
    - No HTLCs at this point

1. Sign the commitment transaction using `signCommitmentTx` and our `funding_private_key` that was used to make the `funding_pubkey` in the `open_channel` message.
1. Construct `funding_created` message - [`createFundingCreatedMessage` subroutine](../routines/createFundingCreatedMessage.md)
1. Send `funding_created` to peer - [`sendMessage` subroutine](../routines/sendMessage.md)
1. Transition to the `Connected Open` state `awaiting_funding_signed`

### 11b. Receive `accept_channel` [invalid]

Upon receipt of an invalid `accept_channel` message or one that we do not agree with, we can fail the channel.

#### Actions

1. Transition to `Failing` channel state
