## Subroutine `sortCommitmentTxOutputs`

Sorts commtiment transaction outputs using BIP69+CLTV ordering in accordance with [BOLT 3](https://github.com/lightning/bolts/blob/master/03-transactions.md#transaction-output-ordering).

Inputs:

-   Outputs

Sorts according to:

-   First sort by value in ascending order
-   Secondary by `scriptpubkey` by comparing by length first in ascending
-   Lastly by `cltv_expiry` in ascending order

Two offerred HTLCs with the same `amount` and `payment_hash` will have identical outputs even when their `cltv_expiry` differs. Ordering matters because of the provided signatures for the `htlc_signatures`.
