# Transitions

## 1. Send `open_channel` message

A node initiates a channel by sending the `open_channel` message. The node must first construct the
message which requires interactions with several subsystems.

**Action:**
1. Construct `open_channel` message using `createOpenChannelMessage` subroutine
1. Send `open_channel` to peer using `sendMessage` subroutine


## 2. Receive `open_channel`

A node may receive an `open_channel` messsage from a peer indicating the peer wishes to fund and create a new channel. The receiving node (also called the fundee) can evaluate the `open_channel` message. The recipient can fail the channel if the parameters are not acceptable. The recipient must also fail the channel if there are certain protocol violations.

**Condition**:
1. Validate the recevied `open_channel` message by calling `validateOpenChannelMessage` subroutine.

### 2a. Receive `open_channel` [valid]

**Effect**:
1. Construct `accept_channel` message using `createAcceptChannelMessage` subroutine
1. Send `accept_channel` to peer using `sendMessage` subroutine

### 2b. Receive `open_channel` [invalid]

In the event that we receive a `open_channel` message that is either invalid or is not acceptable we will need to fail the channel.

**Effect**:
1. Construct an `error` by providing the `temporary_channel_id` and `data` to `createErrorMessage`
1. Send `error` message to peer
1. Transition to `abandonned` channel state


## 11. Receive `accept_channel`

After sending the `open_channel` message, the funding node must wait for the peer to reply with an `accept_channel` message. The peer replies with this message if they agree to open the channel with the rules proposed by the funder. The funder must validate the `accept_channel` message and ensure the parameters sent by the fundee are agreeable.

**Condition**:
1. Validate the received `accept_channel` message by calling `validateAcceptChannelMessage` routing.

### 11a. Receive `accept_channel` [valid]

With a valid `accept_channel` message the funding node can move forward on creating the channel. The funding node move sforward by sending a `funding_created` message to the peer.

**Effect**:
1. Construct `funding_created` message using `createFundingCreatedMessage` subroutine
1. Send `funding_created` to peer


## 14. Receive `accept_channel` [invalid]

Upon receipt of an invalid `accept_channel` message or one that we do not agree with, we can fail the channel.

**Effect**: Fail the channel

At this stage we can send an error message to the peer to be polite. We can mark the channel as failed and ignore subsequent messages about it.

## 12. Disconnect

As the channel funder, we only need to remember the channel after we have broadcast the funding transaction. Prior to this, if we disconnect from the peer for any reason, we can forget the channel and try to construct the channel again once we have reconnected.

**Effect**

1. Transition to `abandoned` channel state


## 15. Receive `shutdown`

If we receive a `shutdown` message from the peer we will need to fail the channel.

**Effect**: Fail the channel

At this stage we can send an error message to the peer to be polite. We can mark the channel as failed and ignore subsequent messages about it.

## 21. Disconnect

Because we are a channel funder, we only need to remember the channel after we have broadcast the funding transaction. Prior to this, if we disconnect from the peer for any reason, we can forget the channel.

**Effect**

Abandon the channel creation. We can try again if we wish next time we connect to the peer.

## 22. Receive `funding_signed`

After the opening node sends the `funding_created` message to the acceptor, the opening node waits for the `funding_signed` message. This message contains the signature for the opening node's version of the commitment transaction, which enables them to spend the funding transaction into their version of the commitment transaction.

The `funding_signed` message also is the first time the real `channel_id` is used, replacing the `temporary_channel_id` that was used in prior messages.

**Condition** Validate received `funding_signed` message

We validate the `funding_signed` message according to the rule defined in [BOLT 2](https://github.com/lightning/bolts/blob/master/02-peer-protocol.md#the-funding_signed-message).

1. Must fail if `channel_id` is not the the XOR of `funding_txid` and `funding_output_index` from the `funding_created` message.
1. Must construct the opener's version of the initial commitment transaction.
1. Must fail if `signature` is not the signature for the opener's initial commitment transaction using the `funding_pubkey` sent in the `accept_channel` message.
1. Must fail if `signature` is not the low-S standard rule from BIP146.

## 23. Recieve `funding_signed` [valid]

Upon receipt of a valid `funding_signed` message, the opening node is ready to broadcast the complete funding transaction.

**Effect** Broadcast funding transaction

The opener now broadcasts the funding transaction to the Bitcoin network.

At this point the opener must remember the channel. We don't provide success or failure conditions as must assume that our funding transaction is successfully broadcast since having a well connected Bitcoin node is a basic security assumption about Lightning Network.

## 24. Receive `funding_signed` [invalid]

Upon receipt of an invalid `funding_signed` message, the opening node will fail the channel by sending an error message and forgetting the channel.

## 25. Receive `shutdown`

If the opening node receives a `shutdown` message from the peer it will fail send an error and abandon the channel.

## 31. Receive `shutdown`

If the accepting node receives a `shutdown` message from the peer it will fail send an error and abandon the channel.

## 32. Receive `funding_created`

After the accepting node sends `accept_channel` the opening node will reply with the `funding_created` message. This message contains the funding output outpoint and includes the signature that the accepting node uses for its first commitment transaction.

**Condition: Validate received `funding_created` message**

Accepting node validates `funding_created` based on the rules in [BOLT 2](https://github.com/lightning/bolts/blob/master/02-peer-protocol.md#the-funding_created-message)

1. Using the provided outpoint in the message, the accepting node constructs its version of the first commitment transaction
1. Fails if the `signature` received is not a valid signature for the acceptor's commitment transaction signed by the `funding_pubkey` sent in `open_channel`.
1. Fails if the `signature` is not a low-s signature.

## 33. Invalid `funding_created` message

If the message is invalid we fail the channel

**Effect: fail the channel**

Send an `error` message and forget the channel

## 34. Valid `funding_created` message

If the message is valid, the accepting node sends a `funding_signed` message to the opening node containing the siginature for the opening node's commitment transaction.

**Effect: send `funding_signed` message**

The accepting node must construct the `funding_signed` message according to [BOLT 2](https://github.com/lightning/bolts/blob/master/02-peer-protocol.md#the-funding_signed-message).

1. Must set the `channel_id` as the XOR of `funding_txid` and `funding_output_index` from the `funding_created` message.
1. Construct the opener's version of the initial commitment transaction
1. Must set the `signature` to the low-s signature of the opener's version of the initial commitment transaction as signed by the `funding_pubkey` sent in the `accept_channel` message.

## 41. Block connected [acceptor & expiry depth reached]

The accepting node should remember the channel after it has sent the `funding_signed` message. The opening node should broadcast the funding transaction with sufficient fees for the transaction to be confirmed in a reasonable period of time. If the funding depth (specified in `accept_channel`) is not reached within 2016 blocks, the accepting node can forget the channel.

**Effect: forget the channel**

Bin it.

## 42. Receive `funding_locked`

A node may receive the `funding_locked` message while it is still awaiting the funding depth. This can occur because of network propagation delays for blocks, meaning your peer may reach the funding depth before you.

**Condition: Validate `funding_locked`**

Validate the message according to [BOLT 2](https://github.com/lightning/bolts/blob/master/02-peer-protocol.md#the-funding_locked-message).

1. Must have a valid secp256k1 point for `next_per_commitment_point`

## 43. Receive `shutdown` message

It is valid to initiate a channel shutdown prior to funding transaction reaching funding depth. Upon receipt of a shutdown we should transition to a mutual close. It is safe to do so because we can agree on how to spend the funding transaction via a closing transaction. The closing transaction is a more efficient version of the commitment transaction (reduced fees and no time locks).

**Effect: Begin shutdown**

Transition to mutual close under the condition that we received a `shutdown` message.

## 44. Block connected [min depth reached]

Our channel must wait for min block depth as specified in the `accept_channel` message. When a block connects matching the min depth, we may proceed. The min depth should consider reorganization and be larger than the max expected reorganization. As such, one the min depth is reached we can transition the channel state even if there is a reorganization.

**Effect: send `funding_locked`**

After the min depth is reached we should send the `funding_locked` message to our peer in accordance with the rules in [BOLT 2](https://github.com/lightning/bolts/blob/master/02-peer-protocol.md#the-funding_locked-message)

1. Must set the `channel_id` correctly
1. Must generate the `next_per_commitment_point` for offerred commitment #1 using the algorithm defined in [BOLT 3](https://github.com/lightning/bolts/blob/master/03-transactions.md#per-commitment-secret-requirements).

## 45. Disconnect

At this point we must remember the channel, so upon disconnect we transition to a state that allows us to maintain our understanding of the channel.


# Subroutines

## Subroutine `createOpenChannelMessage`

Construct and return `open_channel` message based on rules in [BOLT 2](https://github.com/lightning/bolts/blob/master/02-peer-protocol.md#the-open_channel-message).

Inputs:
* `chain_hash`
* `funding_satoshis`
* `push_msat`
* Node's channel preferences

Calls:
* `createTempChannelId`
* `obtainDesiredFeeratePerKw`
* `checkWalletHasFunds`
* `obtainNodeDustLimit`
* `createFundingSecret`
* `createBasePointSecrets`
* `createPerCommitmentSecret`

1. Must set `chain_hash` to the appropriate value for the the chain the node wishes to create the channel on. This value is usually the genesis block in internal byte order of the block hash (little-endian).
1. Must construct a `temporary_channel_id` that is unique to other channel ids with the same peer using the `createTempChannelId` subroutine.
1. Should set the `feerate_per_kw` to at least a rate that would get the transaction immediately included in a block by calling `obtainDesiredFeeratePerKw`.
1. Must validate the `funding_satoshis` is available in the wallet by calling `checkWalletHasFunds` subroutine.
1. Must validate that `funding_satoshis` is is less than 2^24 when `option_channel_support_large_channels` has not been negotiated.
1. Must validate that the `funding_satoshis` is sufficient for full fee payment of the initial commitment transaction. This should be `724 * feerate_per_kw / 1000`.
1. Must set `push_msat` <= 1000 \* `funding_satoshi`.
1. Must set `dust_limit_satoshis` \>= 354 satoshis as calculated from [BOLT 3](https://github.com/lightning/bolts/blob/93909f67f6a48ee3f155a6224c182e612dd5f187/03-transactions.md#per-commitment-secret-requirements).
1. Should set `dust_limit_satoshis` to a value sufficient to propagate transactions is sufficient to propagate transactions by checking with the Bitcoin node using `obtainNodeDustLimit` subroutine.
1. Must set `channel_reserve_balance` for use by the opposite node.
1. Must set `channel_reserve_balance` >= sent `dust_limit_satoshis` value.
1. Must ensure that at least one of `to_local` and `to_remote` outputs is > `channel_reserve_balance`.
1. Should set `to_self_delay` to a value in blocks it wishes to delay the peer's access to its funds in the event it broadcasts its version of the commitment transaction.
1. Should set `htlc_mimimum_msat` to the minimum value HTLC it is willing to accept from the peer
1. Should set `max_acccepted_htlcs` to the maximum value of HTLCs it is will to accept from the peer.
1. Must set `max_accepted_htlcs` <= 483
1. Should set `max_htlc_value_in_flight_msat` to the maximum millisatoshi value your are willing to allow for all HTLCs that are outstanding (both offerred and accepted).
1. Must create a `funding_pubkey` that is a valid point using the `createFundingSecret` subroutine.
1. Must construct unique and unguessable secrets and generate valid public keys for `payment_basepoint_`, `_delayed_payment_basepoint_`, `_htlc_basepoint` and `_revocation_basepoint_` by calling the `createBasePointSecrets`.
1. Must obtain a unique and unguessable seed using `createCommitmentSeed` subroutine.
1. Must generate `first_per_commitment_point` by caling`createPerCommitmentSecret` subroutine.

**Notes:**
Does not include notes for `option_support_large_channel`, `option_upfront_shutdown_script` or `option_channel_type`.


## Subroutine `createTempChannelId`

Construct a 32-byte temporary channel identifier that is unique to the channel and peer.


## Subroutine `obtainDesiredFeeRatePerKw`

Obtains a `feerate_per_kw` that will ensure a transaction will be immediately included in a block. This method may use an external wallet's knowledge of fee rates to determine the optimal value.


## Subroutine `checkWalletHasFunds`

Verify with the wallet that sufficient funds are available for spending.


## Subroutine `createFundingSecret`

Calls the wallet to obtain a new secret whose pubkey will be used in the funding transaction.


## Subroutine `createBasePointSecrets`

Calls the wallet to obtain new basepoint secrets for `payment_basepoint_`, `_delayed_payment_basepoint_`, `_htlc_basepoint` and `_revocation_basepoint_`.


## Subroutine `createCommitmentSeed`

Calls the wallet to obtain an unguessabele seed for use in the per-commitment secret.


## Subroutine `createPerCommitmentSecret`

Creates the per-commitment secret from the seed and the commitment number.


## Subroutine `obtainNodeDustLimit`

Returns the configured dust limit for the Bitcoin node backing the Lightning instance.


## Subroutine `sendMessage`

Sends a message to a peer over the wire.


## Subroutine `validateOpenChannelMessage`

Validate the recevied `open_channel` message as defined in [BOLT 2](https://github.com/lightning/bolts/blob/master/02-peer-protocol.md#the-open_channel-message).

Inputs:
* Received `open_channel` message
* Node's channel preferences

Calls:
* `obtainDesiredFeeRatePerKw`

1. Must fail if the the `chain_hash` is unknown
1. Must fail if `funding_satoshis` >= 2^24 and `option_support_large_channel` has not be negotiated
1. May fail if `funding_satoshis` is too small
1. Must fail if `push_msat` > `funding_sats` \* 1000
1. Must fail if `to_self_delay` is unreasonable large. While there is no hard limit, the receiving node should not subject itself to possible denial-of-service attacks. A reasonable value is 1 day to 2 weeks.
1. Must fail if `max_accepted_htlcs` > 483
1. May fail if `max_accepted_htlcs` is too small
1. Must fail if `feerate_per_kw` is too small for timely processing after calling `obtainDesiredFeeRatePerKw` subroutine.
1. Must fail if `feerate_per_kw` is unreasonably large
1. Must fail if funder's amount for the initial commitment is not sufficient for full fee payment
1. May fail if `channel_reserve_balance` is too large
1. Must fail if both `to_local` and `to_remote` are <= `channel_reserve_satoshis`
1. Must fail if `dust_limit_satoshis` > `channel_reserve_balance`
1. Must fail if `dust_limit_satoshis` < 354 satoshis
1. May fail if it considers `dust_limit_satoshis` too large
1. Must fail if `funding_pubkey` is an invalid public key
1. Must fail if `payment_basepoint`, `delayed_payment_basepoint`, `htlc_basepoint`, or `revocation_basepoint` are invalid public keys
1. May fail if `announce_channels` was false, yet wishes to publically announce channels
1. May fail if it considers `htlc_mimium_msat` too large
1. May fail if `max_htlc_value_in_flight_msat` is too small

## Subrountine `createAcceptChannelMessage`

Constructs an `accept_channel` message according to [BOLT 2](https://github.com/lightning/bolts/blob/master/02-peer-protocol.md#the-accept_channel-message).

Inputs:
* Received `open_channel` message
* Node's channel preferences

Calls:
* `createFundingSecret`
* `createBasePointSecrets`
* `createCommitmentSeed`
* `createPerCommitmentSecret`

1. Must set `temporary_channel_id` as provided in `open_channel`
1. Should set `minimum_depth` to a number of blocks it considers reasonable to avoid double-spends.
   Eg. 6 blocks.
1. Must set `channel_reserve_satoshis` >= `dust_limit_satoshis` from `open_channel`. This ensures the peer's `channel_reserve_satoshis` is larger than their `dust_limit_satoshis`.
1. Must set `dust_limit_satoshis` <= `channel_reserve_satoshis` from the open channel message. This ensures our `dust_limit_satoshis` is less than our `channel_reserve_balance`.
1. Should set `to_self_delay` to a value in blocks it wishes to delay the peer's access to its funds in the event it broadcasts its version of the commitment transaction.
1. Should set `htlc_mimimum_msat` to the minimum value HTLC it is willing to accept from the peer
1. Should set `max_acccepted_htlcs` to the maximum value of HTLCs it is will to accept from the peer.
1. Must set `max_accepted_htlcs` <= 483
1. Should set `max_htlc_value_in_flight_msat` to the maximum millisatoshi value your are willing to allow for all HTLCs that are outstanding (both offerred and accepted).
1. Must create a `funding_pubkey` that is a valid point using the `createFundingSecret` subroutine.
1. Must construct unique and unguessable secrets and generate valid public keys for `payment_basepoint`, `delayed_payment_basepoint`, `htlc_basepoint` and `revocation_basepoint` by calling `createBasePointSecrets` subroutine
1. Must obtain a unique and unguessable seed by calling `createCommitmentSeed` suboutine.
1. Must generate `first_per_commitment_point` by calling `createPerCommitmentSecret` subroutine.


## Subroutine `createErrorMessage`

Construct an `error` message according to [BOLT 1](https://github.com/lightning/bolts/blob/master/01-messaging.md#the-error-and-warning-messages).

Inputs:
* Channel Id
* Data


## Subroutine `validateAcceptChannelMessage`

Validates `accept_channel` message according to [BOLT 2](https://github.com/lightning/bolts/blob/master/02-peer-protocol.md#the-accept_channel-message).

Inputs:
* Send `open_channel` message
* Received `accept_channel` message
* Node's channel preferences

1. Must fail if `temporary_channel_id` does not match the value sent in `open_channel`
1. May fail if `minimum_depth` is unreasonably large. This value is set by the fundee and is the number of blocks both parties must wait until `funding_locked` can be sent to transition the channel into an operational state. The fundee sets this value to a block depth that should ensure the funding transaction can't be double-spent. Validating that `minimum_depth` is not excessively large ensures that it is not being used as a denial-of-service to lock funds in the channel with no intention of allowing the channel to function normally.
1. Must fail if `channel_reserve_satoshis` is less than `dust_limit_satoshi` sent in `open_channel`. Since the received value for `channel_reserve_satoshi` is the value that the funder must retain in its balance, we need to ensure that it is larger than our `dust_limit_satoshis` value (which we sent in `open_channel`).
1. May fail if `channel_reserve_balance` is too large
1. Must fail if `dust_limit_satohis` is greater than `channel_reserve_satoshis` sent in `open_channel`. The funding node provides a `channel_reserve_satoshis` value in `open_channel` that the fundee must maintain. This check ensures that the fundee's `dust_limit_satoshis` value is <= the `channel_reserve_satoshis` it must maintain.
1. Must fail if `dust_limit_satoshis` < 354 satoshis
1. Must fail if `to_self_delay` is unreasonable large. While there is no hard limit, the receiving node should not subject itself to possible denial-of-service attacks. A reasonable value is 1 day to 2 weeks.
1. Must fail if `max_accepted_htlcs` > 483
1. May fail if `max_accepted_htlcs` is too small
1. May fail if it considers `dust_limit_satoshis` too large
1. Must fail if `funding_pubkey` is an invalid public key
1. Must fail if `payment_basepoint`, `delayed_payment_basepoint`, `htlc_basepoint`, or `revocation_basepoint` is an invalid public keys
1. May fail if it considers `htlc_mimium_msat` too large
1. May fail if `max_htlc_value_in_flight_msat` is too small


## Subroutine `createFundingCreatedMessage`

Send `funding_created` message as defined in [BOLT 2](https://github.com/lightning/bolts/blob/master/02-peer-protocol.md#the-funding_created-message).

Inputs:
* Our `funding_pubkey`/`funding_private_key`
* Peer `funding_pubkey`
* `to_local` balance from `open_channel`
* `to_remote` balance from `open_channel`

Calls:
* `createFundingTx`
* `createCommitmentTx`
* `signCommitmentTx`

1. Construct a funding transaction by calling `createFundingTx` using the funding pubkeys.
1. Construct the first commitment transaction so that we can provide the signature to the fundee by calling the `createRemoteCommitmentTx` with values.
    * Commitment number = 0
    * Local as the funding node
    * Channel `funding_outpoint` created in prior step
    * Channel `feerate_per_kw` we sent in `open_channel`
    * Counterparty's `dust_limit_satoshis` we received in `accept_channel`
    * Counterparty's balance which will be `push_msat` / 1000 from `open_channel`
    * Our balance which will be `funding_satoshis` less `push_msat` / 1000
    * Counterparty's `to_self_delay` we sent in `open_channel`
    * Counterparty's `per_commitment_point` we received as `first_per_commitment_point` in `accept_channel`
    * Counterparty's `delayed_payment_basepoint` we received in `accept_channel`
    * Our `payment_basepoint` we sent in `open_channel`
    * Our `revocation_basepoint` we sent in `open_channel`
    * No HTLCs at this point
1. Sign the commitment transaction using `signCommitmentTx` and our `funding_private_key` that was used to make the `funding_pubkey` in the `open_channel` message.
1. Once we have created and signed the commitment transaction we can construct the `funding_created` message which:
    1. Must set the `temporary_channel_id` to the same as that in the `open_channel` message
    1. Must set the `funding_txid` to the funding transaction id
    1. Must not broadcast the funding transaction
    1. Must set the `funding_output_index` to the output number of that transaction that corresponds
    1. Must set the `signature` to the valid signature using the `funding_pubkey` from `open_channel` of the fundee's version of the first commitment transaction



## Subroutine `createFundingTx`

Inputs:
* `feerate_per_kw`
* `funding_satoshis`
* `funding_pubkey` from funder
* `funding_pubkey` from fundee

Calls:
* `obtainUtxo`
* `obtainChangeAddress`

Constructs a transaction with one or more inputs sufficient to cover the `funding_satoshis` value. Contains one or more outputs, one of which must be the funding output. The funding transaction is defined [BOLT 3](https://github.com/lightning/bolts/blob/master/03-transactions.md#funding-transaction-output). This funding output must be a P2WSH output script matching:

    ```
    2 <pubkey1> <pubkey2> 2 OP_CHECKMULTISIG
    ```

* The pubkeys are the lexicographical ordering of the `funding_pubkey` values from the `open_channel` and `accept_channel` messages. Lexicographical ordering improves privacy by not leaking which of the nodes is the funding node.
* Once this transaction is created, we can use the outpoint (txid + output index). We will hold off on broadcasting the funding transaction until we have a valid commitment signature from our peer.
* This transaction should only use segwit BIP141 (SegWit) inputs.


## Subroutine `obtainUtxo`

Retrieves a UTXO from the wallet that is sufficient to cover the request amount.

Inputs:
* `funding_satoshis`


## Subroutine `obtainChangeAddress`

Obtains a change address from the wallet.


## Subroutine `createRemoteCommitmentTx`

Constructs a commitment transaction for the counterparty by calling the `createCommitmentTx` with appropriate values
* Commitment number
* Channel funding side (local or remote)
* Channel `funding_outpoint`
* Channel `feerate_per_kw`
* Counterparty's `dust_limit_satoshis`
* Counterparty's satoshi balance
* Our satoshi balance
* Counterparty's `to_self_delay`
* Counterparty's `per_commitment_point`
* Counterparty's `delayed_payment_basepoint`
* Our `payment_basepoint`
* Our `revocation_basepoint`
* Received HTLCs
* Offerred HTLCs


## Subroutine `createCommitmentTx`

Construct the commitment transaction according to [BOLT 3](https://github.com/lightning/bolts/blob/master/03-transactions.md#commitment-transaction) using the [construction algorithm](https://github.com/lightning/bolts/blob/master/03-transactions.md#commitment-transaction-construction).

Inputs:
* Commitment number
* Channel funding side (local or remote)
* Channel `funding_outpoint`
* Channel `feerate_per_kw`
* `dust_limit_satoshis`
* `to_local_satoshis` value
* `to_remote_satoshis` value
* `to_self_delay` for local
* local `per_commitment_point` value
* local `delayed_payment_basepoint` value
* remote `payment_basepoint` value
* remote `revocation_basepoint` value
* offerred HTLCs
* received HTLCs

Calls:
* `createObscurredCommitmentNumber`
* `derivePubKeyFromBasepoint`
* `deriveRevocationPubKey`
* `createRsmcScript`
* `calcCommtimentTxWeight`
* `calcFeesFromWeight`
* `sortCommitmentTxOutputs`

* Tx version should be 2
* Obtain the obscurred commitment number using `createObscurredCommitmentNumber`
* The locktime should have its upper 8 bits set to 0x20 and the lwoer 24 bits set to the lower 24 bits of the obscured commitment number.
* Construct single input
    * Uses `funding_outpoint`
    * The `sequence` should have upper 8-bits equal to 0x80 and the lower 24-bits set to the the upper 24-bits of the obscrurred commitment number.
* Filter HTLCs below `dust_limit_satoshis`
* Calculate `weight` using `calcCommtimentTxWeight` subroutine by supplying the HTLC count
* Calculate `fees` using `calcFeesFromWeight` subroutine with the `weight` and `feerate_per_kw`
* Calculate `to_local` and `to_remote` values and subtract `fees` from the funding side
* If `to_local` > `dust_limit_satoshis`
    * Creates the `local_delayedpubkey` by calling `derivePubKeyFromBasePoint` using the `delayed_payment_basepoint` and the `per_commitment_point`
    * Creates the `revocationpubkey` by call `deriveRevocationPubKey` using the `revocation_basepoint` and the `per_commitment_point`.
    * Creates an RSMC script using the `local_delayedpubkey` and the `revocationpubkey` by calling `createRsmcScript` subroutine.
    * Create the `to_local` output with the `to_local_satoshis` value and the RSMC script
* If `to_remote` > `dust_limit_satoshis`
    * Create the `to_remote` output with the `to_remote_satoshis` value and a P2WPKH with the remote `payment_basepoint` value
* Sort outputs using `sortCommitmentOutputs` subroutine.


## Subroutine `derivePubKeyFromBasepoint`

Derives a `localpubkey`, `remotepubkey`, `htlcpubkey`, `delayedpubkey` using the `payment_basepoint` and counterparty's `per_commitment_point` as defined in [BOLT 3](https://github.com/lightning/bolts/blob/master/03-transactions.md#localpubkey-local_htlcpubkey-remote_htlcpubkey-local_delayedpubkey-and-remote_delayedpubkey-derivation).

The formula:
```
pubkey = payment_basepoint + SHA256(per_commitment_point || payment_basepoint) * G
```


## Subroutine `deriveRevocationPubKey`

Derives the `revocationpubkey` from the `revocation_basepoint` and the remote `per_commitment_point` as defined in [BOLT 3](https://github.com/lightning/bolts/blob/master/03-transactions.md#remotepubkey-derivation).

The forumula:
```
revocationpubkey = revocation_basepoint * SHA256(revocation_basepoint || per_commitment_point) + per_commitment_point * SHA256(per_commitment_point || revocation_basepoint)
```


## Subroutine `createObscurredCommitmentNumber`

Generate the obscured commitment number as defined in [BOLT 3](https://github.com/lightning/bolts/blob/master/03-transactions.md#commitment-transaction) by taking the number and `XOR` it with the lower 48 bits of

```
SHA256(payment_basepoint from open_channel || payment_basepoint from accept_channel)
```

Obscuring the commitment number in the case of unilateral close, but allows a counterparty to easily identify which commitment number is offerred.



## Subroutine `createRsmcScript`

Creates a revocable sequence maturing contract as defined in [BOLT 3](https://github.com/lightning/bolts/blob/master/03-transactions.md#to_local-output).

Input:
* `delayed_pubkey`
* `revocation_pubkey`
* `to_self_delay`

```
OP_IF
    # Penalty transaction
    <revocationpubkey>
OP_ELSE
    `to_self_delay`
    OP_CHECKSEQUENCEVERIFY
    OP_DROP
    <local_delayedpubkey>
OP_ENDIF
OP_CHECKSIG
```



## Subroutine `calcCommitmentTxWeight`

Calculates the fees for the commitment transaction according to [BOLT 3](https://github.com/lightning/bolts/blob/master/03-transactions.md#fee-calculation).

Inputs:
* Num unpruned HTLCs

Makes some assumptions to simplify fee calculations

* Signatures are 73 bytes (maximum length)
* 1-byte of outputs
* Always includes `to_local` and `to_remote` outputs


```
Commitment weight = 724 + 172 * num_unpruned_htlcs
```

**Note** Doe not support anchors


## Subroutine `calcFeesFromWeight`

Calculates the commitment transaction fees based on the weight and the `feerate_per_kw`.

Inputs:
* Weight
* `feerate_per_kw`

```
fees = weight * feerate_per_kw / 1000
```


## Subroutine `sortCommitmentTxOutputs`

Sorts commtiment transaction outputs using BIP69+CLTV ordering in accordance with [BOLT 3](https://github.com/lightning/bolts/blob/master/03-transactions.md#transaction-output-ordering).

Inputs:
* Outputs

Sorts according to:
* First sort by value in ascending order
* Secondary by `scriptpubkey` by comparing by length first in ascending
* Lastly by `cltv_expiry` in ascending order

Two offerred HTLCs with the same `amount` and `payment_hash` will have identical outputs even when their `cltv_expiry` differs. Ordering matters because of the provided signatures for the `htlc_signatures`.

