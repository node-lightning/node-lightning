## Subroutine `validateChannelReserveReachable`

This rules exists to ensure you can't block a peer from being able to send payment. Consider a fundee that has no funds on their side of the channel initially. As the funder makes payments, the fundee's balance will increase. The fundee is unable to send payments that would cause it to fall below the `channel_reserve` value set by the funder in the `open_channel` message. If the funder sets a value that is too high it can block the funder from ever being able to send payments using this channel.

This rule checks that the `channel_reserve` balance is set to less than the sum of `to_local` and `to_remote` outputs.

To do this it calculates the fees for the initial commitment transaction using the formula:

```
fees = baseCommitmentTxWeight * feeRatePerKw) / 1000;
```

Where we know from [BOLT 3](https://github.com/lightning/bolts/blob/master/03-transactions.md#expected-weight-of-the-commitment-transaction) that the `baseCommitmentTxWeight` is going to be 724.

We calculate the funder's balance as

```
funderBalance = fundingAmount - pushAmount - fees
```

And we know the fundee's balance is simply

```
fundeeBalance = pushAmount
```

This method fails if the `channelReserve` value is less than both the `funderBalance` and the `fundeeBlance`.

Inputs:

-   `fundingAmount`: `Value`
-   `pushAmount`: `Value`
-   `feeRatePerKw`: `Value`
-   `channelReserve`: `Value`
