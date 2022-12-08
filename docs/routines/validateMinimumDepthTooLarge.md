## Subroutine `validateMinimumDepthTooLarge`

Inputs:

-   `minimumDepth`: `number`
-   `channelPreferences`: `ChannelPreferences`

BOLT 2 specifies that the recipient of an `accept_channel` message may fail the channel if the `minimum_depth` value is unreasonably large.

This value is set by the fundee and is the number of blocks both parties must wait until `channel_ready` can be sent to transition the channel into an operational state. The fundee sets this value to a block depth that should ensure the funding transaction can't be double-spent. Validating that `minimum_depth` is not excessively large ensures that it is not being used as a denial-of-service to lock funds in the channel with no intention of allowing the channel to function normally.
