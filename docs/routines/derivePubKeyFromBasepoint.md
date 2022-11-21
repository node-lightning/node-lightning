## Subroutine `derivePubKeyFromBasepoint`

Derives a `localpubkey`, `remotepubkey`, `htlcpubkey`, `delayedpubkey` using the `payment_basepoint` and counterparty's `per_commitment_point` as defined in [BOLT 3](https://github.com/lightning/bolts/blob/master/03-transactions.md#localpubkey-local_htlcpubkey-remote_htlcpubkey-local_delayedpubkey-and-remote_delayedpubkey-derivation).

The formula:

```
pubkey = payment_basepoint + SHA256(per_commitment_point || payment_basepoint) * G
```
