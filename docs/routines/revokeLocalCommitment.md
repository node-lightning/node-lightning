## Subroutine `revokeLocalCommitment`

Inputs:

-   `channel`: `Channel`

Calls:

-   `CommitmentSecretStore.insert`
-   `createPerCommitmentSecret`

This function is used when preparing to send `channel_ready` or prior to sending the `revoke_and_ack` message to a peer (refer to [`channel_updates`](../states/channel_update.md) flow). This function will revoke the properties of the current commitment and transition the `next_*` values into the the current, thus establishing a new "next commitment".

1. Stores the secret in the CommitmentSecretStore when provided with `revoke_and_ack`. Note that since no prior commitment is revoked when this is called with `channel_ready` we don't need to store anything.
1. Removes the current commitment and makes the next commitment the current
1. Creates a new next commitment number
1. Creates a new per-commitment point using `createPerCommitmentSecret`
