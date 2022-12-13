## Subroutine `createCommitmentTx`

Inputs:

-   `commitmentNumber`: `number`
-   `isLocal`: `boolean`
-   `holderIsFunder`: `boolean`
-   `fundingOutPoint`: `OutPoint`
-   `feeRawPerKw`: `Value`
-   `toLocalValue`: `Value`
-   `toRemoteValue`: `Value`
-   `toLocalDelay`: `number`
-   `perCommitmentPoint`: `PublicKey`
-   `delayedPaymentPoint`: `PublicKey`
-   `remotePaymentPoint`: `PublicKey`
-   `revocationPoint`: `PublicKey`
-   `htlcs`

Calls:

-   `createObscurredCommitmentNumber`
-   `createCommitmentTxSequence`
-   `createCommitmentTxLockTime`
-   `calcCommitmentTxWeight`
-   `calcFeesFromWeight`
-   `createOfferedHtlcScript`
-   `createReceivedHtlcScript`
-   `createRsmcScript`
-   `sortCommitmentTxOutputs`

Construct the commitment transaction according to [BOLT 3](https://github.com/lightning/bolts/blob/master/03-transactions.md#commitment-transaction) using the [construction algorithm](https://github.com/lightning/bolts/blob/master/03-transactions.md#commitment-transaction-construction). Transaction should be constructed as follows:

-   Tx version should be 2
-   Obtain the obscured commitment number using `createObscurredCommitmentNumber`
-   The `locktime` should be constructed using the `obscuredCommitmentNumber` as input to the `createCommitmentTxLockTime` subroutine.
-   Construct single input
    -   Uses `funding_outpoint`
    -   The `sequence` should be constructed using the `obscuredCommitmentNumber` as input to the `createCommitmentTxSequence` subroutine.
-   Filter HTLCs below `dust_limit_satoshis`
-   Calculate `weight` using `calcCommitmentTxWeight` subroutine by supplying the HTLC count
-   Calculate `fees` using `calcFeesFromWeight` subroutine with the `weight` and `feerate_per_kw`
-   Calculate `to_local` and `to_remote` values and subtract `fees` from the funding side
-   If `to_local` > `dust_limit_satoshis`, creates the `to_local` output paying the `toLocalValue` with an RSMC script paying to the `local_delayedpubkey` and the `revocationpubkey` created with the `createRsmcScript` subroutine
-   If `to_remote` > `dust_limit_satoshis`, create the the `to_remote` output paying the `toRemoteValue` to a P2WPKH script for the `remotePaymentPoint`
-   Sort outputs using `sortCommitmentOutputs` subroutine
