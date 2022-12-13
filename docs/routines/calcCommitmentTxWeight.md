## Subroutine `calcCommitmentTxWeight`

Inputs:

-   `unprunedHtlcCount`: `number`

Calculates the fees for the commitment transaction according to [BOLT 3](https://github.com/lightning/bolts/blob/master/03-transactions.md#fee-calculation).

Makes some assumptions to simplify fee calculations

-   Signatures are 73 bytes (maximum length)
-   1-byte of outputs
-   Always includes `to_local` and `to_remote` outputs

```
Commitment weight = 724 + 172 * num_unpruned_htlcs
```

**Note** Doe not support anchors
