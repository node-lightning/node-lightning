## Subroutine `createRemoteCommitmentTx`

Constructs a commitment transaction for the counterparty by calling the `createCommitmentTx` with values

-   Commitment number
-   Channel funding side (local or remote)
-   Channel `funding_outpoint`
-   Channel `feerate_per_kw`
-   Counterparty's `dust_limit_satoshis`
-   Counterparty's satoshi balance
-   Our satoshi balance
-   Counterparty's `to_self_delay`
-   Counterparty's `per_commitment_point`
-   Counterparty's `delayed_payment_basepoint`
-   Our `payment_basepoint`
-   Our `revocation_basepoint`
-   Received HTLCs
-   Offerred HTLCs
