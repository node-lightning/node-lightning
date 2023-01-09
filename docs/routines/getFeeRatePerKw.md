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

Another example:
A standard p2wpkh transaction:

```
Transaction
    vsize=141
    weight=561

In reality the vsize = ceil(weight/4)
    561/4 = 140.25 = ceil(140.25) = 141

For the sake of simple numbers we'll treat the weight as
    4*141=564

With a feerate of 20 sats/vbyte = 20_000 sats/kvbyte

Transaction fees are going to be:
    2820 sats

We can see that:
    141 vbytes * 20 sats/vbyte = 2810 sats
    141 vbytes * 20_000 sats/kvbyte / 1000 = 2810 sats
    564 weight * 5 sats/weight = 2810 sats (due to ceil)
    564 weight * 5_000 sats/kw / 1000 = 2810 sats (due to ceil)


So converting sats/kvbyte to sats/kw just divides by 4.
```
