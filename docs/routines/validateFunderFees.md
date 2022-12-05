## Subroutine `validateFunderFees`

Validates that the funder has enough balance to pay fees at the specified `feerate_per_kw` as specified in [BOLT 2](https://github.com/lightning/bolts/blob/master/02-peer-protocol.md#the-open_channel-message).

The fees are calculated as

```
fees = 724 * `feerate_per_kw` / 100
```

The funder's balance for the first commitment transaction is calculated as

```
funderBalance = fundingAmount - pushAmount
```

If the funder's balances is less than fees this function returns false.

Inputs:

-   `fundingAmount`: `Value`
-   `pushAmount`: `Value`
-   `feeRatePerKw`: `Value`
