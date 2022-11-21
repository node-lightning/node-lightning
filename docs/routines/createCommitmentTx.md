## Subroutine `createCommitmentTx`

Construct the commitment transaction according to [BOLT 3](https://github.com/lightning/bolts/blob/master/03-transactions.md#commitment-transaction) using the [construction algorithm](https://github.com/lightning/bolts/blob/master/03-transactions.md#commitment-transaction-construction).

Inputs:

-   Commitment number
-   Channel funding side (local or remote)
-   Channel `funding_outpoint`
-   Channel `feerate_per_kw`
-   `dust_limit_satoshis`
-   `to_local_satoshis` value
-   `to_remote_satoshis` value
-   `to_self_delay` for local
-   local `per_commitment_point` value
-   local `delayed_payment_basepoint` value
-   remote `payment_basepoint` value
-   remote `revocation_basepoint` value
-   offerred HTLCs
-   received HTLCs

Calls:

-   `createObscurredCommitmentNumber`
-   `derivePubKeyFromBasepoint`
-   `deriveRevocationPubKey`
-   `createRsmcScript`
-   `calcCommtimentTxWeight`
-   `calcFeesFromWeight`
-   `sortCommitmentTxOutputs`

Transaction should be constructed as follows:

-   Tx version should be 2
-   Obtain the obscurred commitment number using `createObscurredCommitmentNumber`
-   The locktime should have its upper 8 bits set to 0x20 and the lwoer 24 bits set to the lower 24 bits of the obscured commitment number.
-   Construct single input
    -   Uses `funding_outpoint`
    -   The `sequence` should have upper 8-bits equal to 0x80 and the lower 24-bits set to the the upper 24-bits of the obscrurred commitment number.
-   Filter HTLCs below `dust_limit_satoshis`
-   Calculate `weight` using `calcCommtimentTxWeight` subroutine by supplying the HTLC count
-   Calculate `fees` using `calcFeesFromWeight` subroutine with the `weight` and `feerate_per_kw`
-   Calculate `to_local` and `to_remote` values and subtract `fees` from the funding side
-   If `to_local` > `dust_limit_satoshis`
    -   Creates the `local_delayedpubkey` by calling `derivePubKeyFromBasePoint` using the `delayed_payment_basepoint` and the `per_commitment_point`
    -   Creates the `revocationpubkey` by call `deriveRevocationPubKey` using the `revocation_basepoint` and the `per_commitment_point`.
    -   Creates an RSMC script using the `local_delayedpubkey` and the `revocationpubkey` by calling `createRsmcScript` subroutine.
    -   Create the `to_local` output with the `to_local_satoshis` value and the RSMC script
-   If `to_remote` > `dust_limit_satoshis`
    -   Create the `to_remote` output with the `to_remote_satoshis` value and a P2WPKH with the remote `payment_basepoint` value
-   Sort outputs using `sortCommitmentOutputs` subroutine.
