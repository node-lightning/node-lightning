## Subroutine `validateFundingCreatedMessage`

Inputs:

-   `channel_info` object
-   `funding_created` message

Accepting node validates `funding_created` based on the rules in [BOLT 2](https://github.com/lightning/bolts/blob/master/02-peer-protocol.md#the-funding_created-message).

1. Add the `funding_outpoint` to the `channel_info`
1. Constructs `local_commitment_tx` for `commitment_number=0` using `createLocalCommitmentTx`
1. Validate the `signature` from `funding_created` using `validateCommitmentSignature` subroutine with the remote `funding_pubkey` and `local_commitment_tx`.
    - Fails if the `signature` received is not a valid signature for the acceptor's commitment transaction signed by the `funding_pubkey` sent in `open_channel`.
    - Fails if the `signature` is not a low-s signature.
