## Subroutine `validateAcceptChannelMessage`

Validates `accept_channel` message according to [BOLT 2](https://github.com/lightning/bolts/blob/master/02-peer-protocol.md#the-accept_channel-message).

Inputs:

-   Send `open_channel` message
-   Received `accept_channel` message
-   Node's channel preferences

Calls:

-   `validateFundingDepth`

1. Must fail if `temporary_channel_id` does not match the value sent in `open_channel`
1. May fail if `minimum_depth` is unreasonably large. This value is set by the fundee and is the number of blocks both parties must wait until `channel_ready` can be sent to transition the channel into an operational state. The fundee sets this value to a block depth that should ensure the funding transaction can't be double-spent. Validating that `minimum_depth` is not excessively large ensures that it is not being used as a denial-of-service to lock funds in the channel with no intention of allowing the channel to function normally.
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
