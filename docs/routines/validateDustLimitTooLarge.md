## Subroutine `validateDustLimitTooLarge`

Inputs:

-   `dustLimit`: `Value`
-   `channelPreferences`: `ChannelPreferences`

BOLT 2 specifies that the recipient of an `open_channel` or `accept_channel` may fail the channel if the `dust_limit_satoshis` value is too large. Outputs below the `dust_limit_satoshis` value are pruned from the commitment transaction. As a result, a value that is too large is an attack vector for stealing funds through fee siphoning.
