## Subroutine `validateAcceptChannelMessage`

Inputs:

-   `Channel`
-   `ChannelPreferences`
-   `AcceptChannelMessage`

Calls:

-   `validateChannelReserveDustLimit`
-   `validateToSelfDelayTooLarge`
-   `validateMaxAcceptedHtlcsTooLarge`
-   `validateDustLimitTooSmall`
-   `validateMinimumDepthTooLarge`
-   `validateHtlcMinimumTooLarge`
-   `validateMaxHtlcInFlightTooSmall`
-   `validateChannelReserveTooLarge`
-   `validateMaxAcceptedHtlcsTooSmall`
-   `validateDustLimitTooLarge`

Validates `accept_channel` message according to [BOLT 2](https://github.com/lightning/bolts/blob/master/02-peer-protocol.md#the-accept_channel-message).

Hard failures:

1. Must fail if `temporary_channel_id` does not match the value sent in `open_channel`
1. Must fail by calling `validateChannelReserveDustLimit`
    - if `channel_reserve_satoshis` is less than `dust_limit_satoshi` sent in `open_channel`
    - if `channel_reserve_satoshis` sent in `open_channel` is less than `dust_limit_satoshis`
1. Must fail if `to_self_delay` is unreasonable large by calling `validateToSelfDelayTooLarge`
1. Must fail if `max_accepted_htlcs` > 483 by calling `validateMaxAcceptedHtlcsTooLarge`
1. Must fail if `funding_pubkey` is an invalid public key
1. Must fail if `payment_basepoint`, `delayed_payment_basepoint`, `htlc_basepoint`, or `revocation_basepoint` is an invalid public keys
1. Must fail if `first_per_commitment_point` is an invalid public key
1. Must fail if `dust_limit_satoshis` < 354 satoshis by calling `validateDustLimitTooSmall`

Rules based on options:

1. May fail if `minimum_depth` is unreasonably large by calling `validateMinimumDepthTooLarge`
1. May fail if it considers `htlc_minimum_msat` too large by calling `validateHtlcMinimumTooLarge`
1. May fail if `max_htlc_value_in_flight_msat` is too small by calling `validateMaxHtlcInFlightTooSmall`
1. May fail if `channel_reserve_balance` is too large by calling `validateChannelReserveTooLarge`.
1. May fail if `max_accepted_htlcs` is too small by calling `validateMaxAcceptedHtlcsTooSmall`
1. May fail if it considers `dust_limit_satoshis` too large by calling `validateDustLimitTooLarge`
