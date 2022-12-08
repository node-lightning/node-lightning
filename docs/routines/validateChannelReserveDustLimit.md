## Subroutine `validateChannelReserveDustLimit`

Inputs:

-   `openDustLimit`
-   `openChannelReserve`
-   `acceptDustLimit`
-   `acceptChannelReserve`

BOLT 2 specifies that the `dust_limit` must be <= `channel_reserve`. Recall that the `dust_limit` value in `open_channel` and
`accept_channel` is for the sender and the `channel_reserve` value is for the recipient.

Initially this method only validates the `open_channel` message validating that the funder's `dust_limit` is <= the fundee's `channel_reserve`.

When `accept_channel` is received we can perform a cross comparison to ensure that both the funder and the fundee have a `dust_limit` <= the their respective `channel_reserve`.
