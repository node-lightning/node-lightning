## Subroutine `getDustLimit`

Returns the configured dust limit for the Bitcoin node backing the Lightning instance. This must conform with [BOLT 3 Dust Limits](https://github.com/lightning/bolts/blob/93909f67f6a48ee3f155a6224c182e612dd5f187/03-transactions.md#dust-limits) and specified limit of 354 as specified in [BOLT 2](https://github.com/lightning/bolts/blob/master/02-peer-protocol.md#the-open_channel-message) in order to accommodate option_shutdown_any_segwit.
