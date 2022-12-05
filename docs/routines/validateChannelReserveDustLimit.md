## Subroutine `validateChannelReserveDustLimit`

This validation ensures that the `dust_limit` is always less than or equal to the `channel_reserve` value even though the `channel_reserve` is set by the channel peer. It does this by validating that the `channel_reserve` is above the `dust_limit` value. The `dust_limit` value is for message creator (funder for `open_channel` and fundee for `accept_channel`). The `channel_reserve` is for the message recipient.

When an `accept_channel` message is created the `dust_limit` must be set below the received `channel_reserve` value that the fundee recieved in `open_channel`. Additionally, the `channel_reserve` value must be set above the `dust_limit` received in the `open_channel` message. These rules are defined in [BOLT 2](https://github.com/lightning/bolts/blob/master/02-peer-protocol.md#the-accept_channel-message).

Inputs:

-   `channel_reserve`
-   `dust_limit`
