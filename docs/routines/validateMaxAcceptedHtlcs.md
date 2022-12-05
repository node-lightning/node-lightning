## Subroutine `validateMaxAcceptedHtlcs`

Ensures that the max_accepted_htlcs is <= 483. This value ensures that the `commitment_signed` message fits within the message length and that a penalty transaction with 2x483 transactions fits within the max transaction size for Bitcoin Core.

Inputs:

-   `maxAcceptedHtlcs`: `number`
