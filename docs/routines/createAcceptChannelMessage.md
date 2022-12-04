## Subrountine `createAcceptChannelMessage`

Constructs an `accept_channel` message according to [BOLT 2](https://github.com/lightning/bolts/blob/master/02-peer-protocol.md#the-accept_channel-message).

Inputs:

-   Received `open_channel` message
-   Node's channel preferences

Calls:

-   `createFundingSecret`
-   `createBasePointSecrets`
-   `createPerCommitmentSeed`
-   `createPerCommitmentSecret`

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
1. Must obtain a unique and unguessable seed by calling `createPerCommitmentSeed` suboutine.
1. Must generate `first_per_commitment_point` by calling `createPerCommitmentSecret` subroutine.
