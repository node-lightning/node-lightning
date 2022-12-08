## Subroutine `validateMaxAcceptedHtlcsTooSmall`

Inputs:

-   `maxAcceptedHtlcs`: `number`
-   `channelPreferences`: `ChannelPreferences`

BOLT 2 specifies that the receiver of an `open_channel` or `accept_channel` message must validate that the `max_accepted_htlcs` value is not too small. This value must be at least greater than 0 or else the channel will be unusable.
