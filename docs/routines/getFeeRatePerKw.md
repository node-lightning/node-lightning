## Subroutine `getFeeRatePerKw`

Obtains a `feerate_per_kw` that will ensure a transaction will be immediately included in a block. This feerate will be used by the commitment transaction and HTLC-Success and HTLC-Timeout secondary transactions.

This implementation uses the wallet's feerate_per_kilobyte and converts it to `feerate_per_kw`. Since weight is 4 \* vbyte we can divide the `feerate_per_kb` by 4 to obtain the `feerate_per_kw`.

For example...

```
60 sat/byte = 60000 sats/kilobyte

A standard commitment transaction without HTLCs is 724 weight or
724/4 = 181 vbytes

This would be 181*60 = 10860 sats

The feerate_per_kiloweight would be 60000/4 = 15000 sats/kw.

724 weight * 15000 sats/kw / 1000 = 10860 sats
```
