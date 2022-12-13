## Subroutine `createCommitmentTxLockTime`

Inputs:

-   `obscuredCommitmentNumber`: `Buffer[6]`

The locktime should have its upper 8 bits set to 0x20 and the lower 24 bits set to the lower 24 bits of the obscured commitment number.
