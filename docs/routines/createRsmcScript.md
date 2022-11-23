## Subroutine `createRsmcScript`

Creates a revocable sequence maturing contract as defined in [BOLT 3](https://github.com/lightning/bolts/blob/master/03-transactions.md#to_local-output).

Input:

-   `delayed_pubkey`
-   `revocation_pubkey`
-   `to_self_delay`

```
OP_IF
    # Penalty transaction
    <revocationpubkey>
OP_ELSE
    `to_self_delay`
    OP_CHECKSEQUENCEVERIFY
    OP_DROP
    <local_delayedpubkey>
OP_ENDIF
OP_CHECKSIG
```
