## Subroutine `createOpenChannelMessage`

Construct and return `open_channel` message based on an established channel object.

Inputs:

-   `channel`

1. Sets `chain_hash` to the appropriate value for the the chain the node wishes to create the channel on. This value is usually the genesis block in internal byte order of the block hash (little-endian).
1. Sets the `temporary_channel_id` that is unique to other channel ids with the same peer
1. Sets the `funding_satoshis` value that will be included in the first commitment transaction as the funder's value
1. Sets the `push_msat` value that will be included in the first commitment transaction as the fundee's value
1. Sets the `feerate_per_kw` value that will be used for the commitment transaction and HTLC-Success and HTLC-Timeout transactions
1. Sets the `dust_limit_satoshis` value that is used for the funder's version of the commitment transaction
1. Sets the `channel_reserve_balance` value that must be maintained by the fundee's side of the channel (once achieved)
1. Sets the `to_self_delay` value that the fundee must wait before claiming their local outputs in their version of the commitment transaction or secondary HTLC transactions
1. Sets the `htlc_mimimum_msat` value that the funder is willing to accept
1. Sets the `max_acccepted_htlcs` value that the funder is willing to accept
1. Sets the `max_htlc_value_in_flight_msat` value that the funder is willing to allow
1. Sets the `funding_pubkey` used by the funder
1. Sets the `payment_basepoint` used by the funder
1. Sets the `delayed_payment_basepoint` used by the funder
1. Sets the `htlc_basepoint` used by the funder
1. Sets the `revocation_basepoint` used by the funder
1. Sets the `first_per_commitment_point` used by the funder for their first commitment transaction
1. Sets whether the funder wishes the channel be be public
