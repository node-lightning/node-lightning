## Subroutine `validateMaxHtlcInFlightTooSmall`

Inputs:

-   `maxHtlcInFlightValue`: `Value`
-   `channel`: `Channel`
-   `channelPreferences`: `ChannelPreferences`

BOLT 2 specifies that the recipient of an `open_channel` or `accept_channel` may fail the channel if the `max_htlc_in_flight_msat` value is too small. This rule exists to prevent a counterparty from setting the value too small making the channel unusable.
