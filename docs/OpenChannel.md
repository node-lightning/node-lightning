# Transitions

## 1. Send `open_channel` message

A node initiates a channel by sending the `open_channel` message. The node must first construct the
message which requires interactions with several subsystems.

**Action:** Construct `open_channel` message based on rules in [BOLT 2](https://github.com/lightning/bolts/blob/master/02-peer-protocol.md#the-open_channel-message).

1. Must set `the chain_hash` to the appropriate value for the the chain the node wishes to create the channel on. This value is usually the genesis block in internal byte order of the block hash (little-endian).
1. Must construct a `temporary_channel_id` that is unique to other channel ids with the same peer.
1. Should set the `feerate_per_kw` to at least a rate that would get the transaction immediately included in a block. This is likely obtained from the wallet.
1. Must validate the `funding_satoshis` is available in the wallet.
1. Must validate that `funding_satoshis` is < 2^24 satoshis.
1. Must validate that the `funding_satoshis` is sufficient for full fee payment of the initial commitment transaction. This should be `724 * feerate_per_kw / 1000`.
1. Must set `push_msat` <= 1000 \* _funding_satoshi_
1. Must set `dust_limit_satoshis` \>= 354 satoshis as calculated from [BOLT 3](https://github.com/lightning/bolts/blob/93909f67f6a48ee3f155a6224c182e612dd5f187/03-transactions.md#per-commitment-secret-requirements)
1. Should set `dust_limit_satoshis` to a value sufficient to propagate transactions.
1. Must set `channel_reserve_balance` for use by the opposite node.
1. Must set `channel_reserve_balance` >= our `dust_limit_satoshis` value.
1. Must ensure that at least one of `to_local` and `to_remote` outputs is > _channel_reserve_balance_.
1. Should set `to_self_delay` to a value in blocks it wishes to delay the peer's access to its funds in the event it broadcasts its version of the commitment transaction.
1. Should set `htlc_mimimum_msat` to the minimum value HTLC it is willing to accept from the peer
1. Should set `max_acccepted_htlcs` to the maximum value of HTLCs it is will to accept from the peer.
1. Must set `max_accepted_htlcs` <= 483
1. Should set `max_htlc_value_in_flight_msat` to the maximum millisatoshi value your are willing to allow for all HTLCs that are outstanding (both offerred and accepted).
1. Must create a `funding_pubkey` that is a valid point
1. Must construct unique and unguessable secrets and generate valid public keys for `payment_basepoint_`, `_delayed_payment_basepoint_`, `_htlc_basepoint` and `_revocation_basepoint_`.
1. Must obtain a unique and unguessable seed
1. Must generate `first_per_commitment_point` based on [generation algorithm in BOLT 3](https://github.com/lightning/bolts/blob/93909f67f6a48ee3f155a6224c182e612dd5f187/03-transactions.md#per-commitment-secret-requirements).

**Notes:**
Does not include notes for `option_support_large_channel_`, `_option_upfront_shutdown_script` or `option_channel_type`.

## 2. Receive `open_channel`

A node may receive an `open_channel` messsage from a peer indicating the peer wishes to fund and create a new channel. The receiving node (also called the fundee) can evaluate the `open_channel` message. The recipient can fail the channel if the parameters are not acceptable. The recipient must also fail the channel if there are certain protocol violations.

**Condition**: Validate the recevied `open_channel` message as defined in [BOLT 2](https://github.com/lightning/bolts/blob/master/02-peer-protocol.md#the-open_channel-message).

1. Must fail if the the `chain_hash` is unknown
1. Must fail if `funding_satoshis` >= 2^24 and `option_support_large_channel` has not be negotiated
1. May fail if `funding_satoshis` is too small
1. Must fail if `push_msat` > `funding_sats` \* 1000
1. Must fail if `to_self_delay` is unreasonable large. While there is no hard limit, the receiving node should not subject itself to possible denial-of-service attacks. A reasonable value is 1 day to 2 weeks.
1. Must fail if `max_accepted_htlcs` > 483
1. May fail if `max_accepted_htlcs` is too small
1. Must fail if `feerate_per_kw` is too small for timely processing
1. Must fail if `feerate_per_kw` is unreasonably large
1. Must fail if funder's amount for the initial commitment is not sufficient for full fee payment
1. May fail if `channel_reserve_balance` is too large
1. Must fail if both to\*local and to\*remote are <= _channel_reserve_satoshis_
1. Must fail if `dust_limit_satoshis` > _channel_reserve_balance_
1. Must fail if `dust_limit_satoshis` < 354 satoshis
1. May fail if it considers `dust_limit_satoshis` too large
1. Must fail if `funding_pubkey` is an invalid public key
1. Must fail if `payment_basepoint`, `delayed_payment_basepoint`, `htlc_basepoint`, or `revocation_basepoint` is an invalid public keys
1. May fail if `announce_channels` was false, yet wishes to publically announce channels
1. May fail if it considers `htlc_mimium_msat` too large
1. May fail if `max_htlc_value_in_flight_msat` is too small

## 3. Receive `open_channel` [invalid]

In the event that we receive a `open_channel` message that is either invalid or is not acceptable we will need to fail the channel.

**Effect**: Fail the channel

At this stage we can send an error message to the peer to be polite. We can then forget the channel if we wish.

## 4. Receive `open_channel` [valid]

Upon receipt of a valid `open_channel` message we reply to the funder with an `accept_channel` message to indicate that the terms of the channel were agreeable.

**Effect**: Construct an `accept_channel` message according to [BOLT 2](https://github.com/lightning/bolts/blob/master/02-peer-protocol.md#the-accept_channel-message).

1. Must set `temporary_channel_id` as provided in _open_channel_
1. Should set `minimum_depth` to a number of blocks it considers reasonable to avoid double-spends.
   Eg. 6 blocks.
1. Must set `channel_reserve_satoshis` >= `dust_limit_satoshis` from `open_channel_. This ensures the peer's _channel_reserve_satoshis` is larger than their _dust_limit_satoshis_.
1. Must set `dust_limit_satoshis` <= `channel_reserve_satoshis` from the open channel message. This ensures our `dust_limit_satoshis` is less than our _channel_reserve_balance_.
1. Should set `to_self_delay` to a value in blocks it wishes to delay the peer's access to its funds in the event it broadcasts its version of the commitment transaction.
1. Should set `htlc_mimimum_msat` to the minimum value HTLC it is willing to accept from the peer
1. Should set `max_acccepted_htlcs` to the maximum value of HTLCs it is will to accept from the peer.
1. Must set `max_accepted_htlcs` <= 483
1. Should set `max_htlc_value_in_flight_msat` to the maximum millisatoshi value your are willing to allow for all HTLCs that are outstanding (both offerred and accepted).
1. Must create a `funding_pubkey` that is a valid point
1. Must construct unique and unguessable secrets and generate valid public keys for `payment_basepoint`, `delayed_payment_basepoint`, `htlc_basepoint` and `revocation_basepoint`.
1. Must obtain a unique and unguessable seed
1. Must generate `first_per_commitment_point` based on [generation algorithm in BOLT 3](https://github.com/lightning/bolts/blob/93909f67f6a48ee3f155a6224c182e612dd5f187/03-transactions.md#per-commitment-secret-requirements).

## 11. Disconnect

Because we are a channel funder, we only need to remember the channel after we have broadcast the funding transaction. Prior to this, if we disconnect from the peer for any reason, we can forget the channel

**Effect**

Abandon the channel creation. We can try again if we wish next time we connect to the peer.

## 12. Receive `accept_channel`

After sending the `open_channel` message, the funding node must wait for the peer to reply with an `accept_channel` message. The peer replies with this message if they agree to open the channel with the rules proposed by the funder. The funder must validate the `accept_channel` message and ensure the parameters sent by the fundee are agreeable.

**Condition**: Validate `accept_channel` message according to [BOLT 2](https://github.com/lightning/bolts/blob/master/02-peer-protocol.md#the-accept_channel-message).

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

## 13. Receive `accept_channel` [valid]

With a valid `accept_channel` message the funding node can move forward on creating the channel. The funding node move sforward by sending a `funding_created` message to the peer.

**Effect**: Send `funding_created` message as defined in [BOLT 2](https://github.com/lightning/bolts/blob/master/02-peer-protocol.md#the-funding_created-message).

-   The funding node must construct a funding transaction that contains a funding output as defined in [BOLT 3](https://github.com/lightning/bolts/blob/master/03-transactions.md#funding-transaction-output). This funding transaction must contain one output that has a P2WSH output script matching:

    ```
    2 <pubkey1> <pubkey2> 2 OP_CHECKMULTISIG
    ```

    -   The pubkeys are the lexicographical ordering of the `funding_pubkey` values from the `open_channel` and `accept_channel` messages. Lexicographical ordering improves privacy by not leaking which of the nodes is the funding node.

    -   Once this transaction is created, we can use the outpoint (txid + output index). We will hold off on broadcasting the funding transaction until we have a valid commitment signature from our peer.

    -   This transaction should only use segwit BIP141 (SegWit) inputs.

-   The funding node must construct the first commitment transaction so that we can provide the signature to the fundee. We construct the commitment transaction according to [BOLT 3](https://github.com/lightning/bolts/blob/master/03-transactions.md#commitment-transaction). A few notes:

    -   The first commitment number is 0.
    -   We should generate the obscured commitment number by taking the number and `XOR` it with the lower 48 bits of

        ```
        SHA256(payment_basepoint from open_channel || payment_basepoint from accept_channel)
        ```

        Obscuring the commitment number in the case of unilateral close, but allows a counterparty to easily identify which commitment number is offerred.

    -   The version should be 2
    -   The locktime should have its upper 8 bits set to 0x20 and the lwoer 24 bits set to the lower 24 bits of the obscured commitment number.
    -   We use a single input
        -   It should use the funding outpoint we generated in the prior step
        -   The sequence should have upper 8-bits equal to 0x80 and the lower 24-bits set to the the upper 24-bits of the obscrurred commitment number.
    -   The `to_local` output pays to the fundee's `localpubkey`. We must derive the fundee's `localpubkey` using the `payment_basepoint` and `first_per_commitment_point` provided by the fundee in `accept_channel`. The formula for this is

        ```
        pubkey = payment_basepoint + SHA256(per_commitment_point || payment_basepoint) * G
        ```

    -   The `to_remote` output pays to us. We should use the `funding_basepoint` we provided in `open_channel` as the `remotepubkey` since we should always use `option_static_remotekey`.
    -   We should not have any other outputs.
    -   We can then sign the transaction using the `funding_pubkey` we provided in `open_channel`.

-   Once we have created and signed the commitment transaction we can construct the `funding_created` message which:
    1. Must set the `temporary_channel_id` to the same as that in the `open_channel` message
    1. Must set the `funding_txid` to the funding transaction id
    1. Must not broadcast the funding transaction
    1. Must set the `funding_output_index` to the output number of that transaction that corresponds
    1. Must set the `signature` to the valid signature using the `funding_pubkey` from `open_channel` of the fundee's version of the first commitment transaction

## 14. Receive `accept_channel` [invalid]

Upon receipt of an invalid `accept_channel` message or one that we do not agree with, we can fail the channel.

**Effect**: Fail the channel

At this stage we can send an error message to the peer to be polite. We can mark the channel as failed and ignore subsequent messages about it.

## 15. Receive `shutdown`

If we receive a `shutdown` message from the peer we will need to fail the channel.

**Effect**: Fail the channel

At this stage we can send an error message to the peer to be polite. We can mark the channel as failed and ignore subsequent messages about it.
