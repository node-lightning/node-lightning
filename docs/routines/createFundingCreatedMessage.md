## Subroutine `createFundingCreatedMessage`

Send `funding_created` message as defined in [BOLT 2](https://github.com/lightning/bolts/blob/master/02-peer-protocol.md#the-funding_created-message).

Inputs:

-   Our `funding_pubkey`/`funding_private_key`
-   Peer `funding_pubkey`
-   `to_local` balance from `open_channel`
-   `to_remote` balance from `open_channel`

Calls:

-   `createFundingTx`
-   `createCommitmentTx`
-   `signCommitmentTx`

1. Construct a funding transaction by calling `createFundingTx` using the funding pubkeys.
1. Construct the first commitment transaction so that we can provide the signature to the fundee by calling the `createRemoteCommitmentTx` with values.
    - Commitment number = 0
    - Local as the funding node
    - Channel `funding_outpoint` created in prior step
    - Channel `feerate_per_kw` we sent in `open_channel`
    - Counterparty's `dust_limit_satoshis` we received in `accept_channel`
    - Counterparty's balance which will be `push_msat` / 1000 from `open_channel`
    - Our balance which will be `funding_satoshis` less `push_msat` / 1000
    - Counterparty's `to_self_delay` we sent in `open_channel`
    - Counterparty's `per_commitment_point` we received as `first_per_commitment_point` in `accept_channel`
    - Counterparty's `delayed_payment_basepoint` we received in `accept_channel`
    - Our `payment_basepoint` we sent in `open_channel`
    - Our `revocation_basepoint` we sent in `open_channel`
    - No HTLCs at this point
1. Sign the commitment transaction using `signCommitmentTx` and our `funding_private_key` that was used to make the `funding_pubkey` in the `open_channel` message.
1. Once we have created and signed the commitment transaction we can construct the `funding_created` message which:
    1. Must set the `temporary_channel_id` to the same as that in the `open_channel` message
    1. Must set the `funding_txid` to the funding transaction id
    1. Must not broadcast the funding transaction
    1. Must set the `funding_output_index` to the output number of that transaction that corresponds
    1. Must set the `signature` to the valid signature using the `funding_pubkey` from `open_channel` of the fundee's version of the first commitment transaction
