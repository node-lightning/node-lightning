## Subroutine `validateFundingSignedMessage`

Inputs:

-   `fundingSigned`: `FundingSignedMessage`
-   `channel`: `Channel`

Calls:

-   `createLocalCommitmentTx`

Validate the `funding_signed` message according to the rule defined in [BOLT 2](https://github.com/lightning/bolts/blob/master/02-peer-protocol.md#the-funding_signed-message) which functionally comes down to validating that the signature is correct for the first local commitment transaction.

Specifically:

1. Must fail if `channel_id` is not the XOR of `funding_txid` and `funding_output_index` from the `funding_created` message.
1. Construct the funders version of the first commitment transaction by calling `createLocalCommitmentTx` with values:
    - Commitment number = 0
    - Local as the funding node
    - Channel `funding_outpoint` created in prior step
    - Channel `feerate_per_kw` we sent in `open_channel`
    - Our `dust_limit_satoshis` sent in `open_channel`
    - Our balance which will be `funding_satoshis` less `push_msat` / 1000
    - Counterparty's balance which will be `push_msat` / 1000 from `open_channel`
    - Our `to_self_delay` we received in `accept_channel`
    - Our `per_commitment_point` we sent as `first_per_commitment_point` in `open_channel`
    - Our `delayed_payment_basepoint` we sent in `open_channel`
    - Counterparty's `payment_basepoint` we received in `accept_channel`
    - Coutnerparty's `revocation_basepoint` we received in `accept_channel`
    - No HTLCs at this point
1. Must fail if `signature` is not the signature for the opener's initial commitment transaction using the `funding_pubkey` sent in the `accept_channel` message or if not a low-S signature.
