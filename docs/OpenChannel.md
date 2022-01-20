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

**Action**: Fail the channel

At this stage we can send an error message to the peer to be polite. We can then forget the channel if we wish.

## 4. Receive `open_channel` [valid]

Upon receipt of a valid `open_channel` message we reply to the funder with an `accept_channel` message to indicate that the terms of the channel were agreeable.

**Action**: Construct an `accept_channel` message according to [BOLT 2](https://github.com/lightning/bolts/blob/master/02-peer-protocol.md#the-accept_channel-message).

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
