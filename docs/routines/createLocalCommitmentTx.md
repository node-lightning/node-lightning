## Subroutine `createLocalCommitmentTx`

Inputs:

-   `channel`: `Channel`

Calls:

-   `derivePubKeyFromBasepoint`
-   `deriveRevocationPubKey`

This method converts the channel object into a specific commitment transaction for the local node. Specifically:

-   Creates the `revocationPubKey` by call `deriveRevocationPubKey` using their `revocationBasePoint` and our `perCommitmentPoint`
-   Creates the `localDelayedPubKey` by calling `derivePubKeyFromBasePoint` using our `delayedPaymentBasePoint` and our `perCommitmentPoint`
-   Creates the `localHtlcPubKey` by calling `derivePubKeyFromBasePoint` using our `htlcBasePoint` and our `perCommitmentPoint`
-   Creates the `remoteHtlcPubKey` by calling `derivePubKeyFromBasePoint` using their `htlcBasePoint` and our `perCommitmentPoint`
-   Calls `createCommitmentTx`
