## Subroutine `deriveRevocationPubKey`

Derives the `revocationpubkey` from the `revocation_basepoint` and the remote `per_commitment_point` as defined in [BOLT 3](https://github.com/lightning/bolts/blob/master/03-transactions.md#remotepubkey-derivation).

The forumula:

```
revocationpubkey = revocation_basepoint * SHA256(revocation_basepoint || per_commitment_point) + per_commitment_point * SHA256(per_commitment_point || revocation_basepoint)
```
