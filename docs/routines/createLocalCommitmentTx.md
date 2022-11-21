## Subroutine `createLocalCommitmentTx`

Constructs commitment transaction the local node by calling the `createCommitmentTx` with values:

-   Commitment number
-   Channel funding side (local or remote)
-   Channel `funding_outpoint`
-   Channel `feerate_per_kw`
-   Our `dust_limit_satoshis`
-   Our satoshi balance
-   Counterparty's satoshi balance
-   Our `to_self_delay`
-   Our `per_commitment_point`
-   Our `delayed_payment_basepoint`
-   Counterparty's `payment_basepoint`
-   Counterparty's `revocation_basepoint`
-   Received HTLCs
-   Offerred HTLCs
