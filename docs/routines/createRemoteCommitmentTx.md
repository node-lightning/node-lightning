## Subroutine `createRemoteCommitmentTx`

Inputs:

-   `channel`: `Channel`

Calls:

-   `derivePubKeyFromBasepoint`
-   `deriveRevocationPubKey`

This method converts the channel object into a specific commitment transaction for the remote node. Specifically:

-   Creates the `revocationPubKey` by call `deriveRevocationPubKey` using our `revocationBasePoint` and their `perCommitmentPoint`
-   Creates the `localDelayedPubKey` by calling `derivePubKeyFromBasePoint` using their `delayedPaymentBasePoint` and their `perCommitmentPoint`
-   Creates the `localHtlcPubKey` by calling `derivePubKeyFromBasePoint` using their `htlcBasePoint` and their `perCommitmentPoint`
-   Creates the `remoteHtlcPubKey` by calling `derivePubKeyFromBasePoint` using our `htlcBasePoint` and their `perCommitmentPoint`
-   Calls `createCommitmentTx`
