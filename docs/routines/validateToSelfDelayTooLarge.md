## Subroutine `validateToSelfDelayTooLarge`

Inputs:

-   `toSelfDelay`: `number`

BOLT2 specifies that we must validate the `to_self_delay` value when receiving the `open_channel` or `accept_channel` message. While there is no hard limit the receiving node should not subject itself to possible denial-of-service attacks. A reasonable value is 1 day to 2 weeks or (1008 or 2016 blocks).
