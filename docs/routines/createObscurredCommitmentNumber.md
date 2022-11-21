## Subroutine `createObscurredCommitmentNumber`

Generate the obscured commitment number as defined in [BOLT 3](https://github.com/lightning/bolts/blob/master/03-transactions.md#commitment-transaction) by taking the number and `XOR` it with the lower 48 bits of

```
SHA256(payment_basepoint from open_channel || payment_basepoint from accept_channel)
```

Obscuring the commitment number in the case of unilateral close, but allows a counterparty to easily identify which commitment number is offerred.
