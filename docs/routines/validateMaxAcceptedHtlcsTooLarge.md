## Subroutine `validateMaxAcceptedHtlcsTooLarge`

Inputs:

-   `maxAcceptedHtlcs`: `number`

Ensures that the `max_accepted_htlcs` is <= 483. This value ensures that the `commitment_signed` message fits within the message length and that a penalty transaction with 2x483 transactions fits within the max transaction size for Bitcoin Core.

Also validates that the `max_accepted_htlcs` is not unreasonably small. If this value is 0, then the channel is unusable.
