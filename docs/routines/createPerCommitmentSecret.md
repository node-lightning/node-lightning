## Subroutine `createPerCommitmentSecret`

Inputs:

-   `seed`: `Buffer`
-   `commitmentNumber`: `number`

Creates the per-commitment secret from the seed and the commitment number using the algorithm defined in [BOLT #3](https://github.com/lightning/bolts/blob/master/03-transactions.md#per-commitment-secret-requirements).
