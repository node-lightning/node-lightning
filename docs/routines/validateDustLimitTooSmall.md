## Subroutine `validateDustLimitTooSmall`

Inputs

-   `dustLimit`: `Value`

Validates that the `dust_limit` is at least 354 in accordance to [BOLT 2](https://github.com/lightning/bolts/blob/master/02-peer-protocol.md#the-open_channel-message). This value is specified from [BOTL 3](https://github.com/lightning/bolts/blob/master/03-transactions.md#dust-limits) and is the value for unknown segwit versions to comply with `option_shutdown_any_segwit`. Prior to this it was set to 330 to comply with P2WSH transactions.
