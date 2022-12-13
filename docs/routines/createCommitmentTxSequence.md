## Subroutine `createCommitmentTxSequence`

Inputs:

-   `obscurrentCommitmentNumber`: `Buffer[6]`

The `sequence` should have upper 8-bits equal to 0x80 and the lower 24-bits set to the the upper 24-bits of the obscured commitment number.
