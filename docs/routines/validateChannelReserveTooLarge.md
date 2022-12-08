## Subroutine `validateChannelReserveTooLarge`

Inputs:

-   `channelReserve`: `Value`
-   `channel`: `Channel`
-   `channelPreferences`: `ChannelPreferences`

BOLT 2 specifies that the receipt of a `open_channel` or `accept_channel` message much validate that the received `channel_reserve` value is not too large. This value exists to ensure each participant in the channel has some value to lose in the event of a breach. A reasonable value is considered 10% of the funding amount
