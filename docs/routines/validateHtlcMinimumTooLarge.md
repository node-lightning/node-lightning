## Subroutine `validateHtlcMinimumTooLarge`

Inputs:

-   `htlcMinimum`: `Value`
-   `channel`: `Channel`
-   `channelPreferences`: `ChannelPreferences`

BOLT 2 specifies that a receiver of either `open_channel` or `accept_channel` may fail the channel if the `htlc_minimum_msat` value is too large. This prevents the counterparty from making the channel unusable by setting the value too high.
