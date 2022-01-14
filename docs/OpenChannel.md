# Transitions

### <a href="#transition_1">1. Send _open_channel_ message</a>

A node initiates a channel by sending the _open_channel_ message. The node must first construct the
message which has several parts.

Construct _open_channel_ message based on [BOLT 2](https://github.com/lightning/bolts/blob/master/02-peer-protocol.md#the-open_channel-message).

1. Set chain_hash to the appropriate chain
2. Construct a unique temporary_channel_id
3. Determine the funding amount. Must be less than 2^24 satoshis if option_supprt_large_channel was
   not negotiated. The node should ensure that there are sufficient funds in the wallet to create a
   channel of this value.
4. Set push_msat <= 1000 \* funding_satoshi
5. Obtain funding key from LN wallet (will use pubkey as funding_pubkey)
6. Construct basepoints (may be derived from the LN wallet)
7. Obtain seed (from LN wallet) and generate first_per_commitment_point based on
   [generation algorithm in BOLT 3](https://github.com/lightning/bolts/blob/93909f67f6a48ee3f155a6224c182e612dd5f187/03-transactions.md#per-commitment-secret-requirements)
8. Calculate dust_limit_satoshi based on values in [BOLT 3](https://github.com/lightning/bolts/blob/93909f67f6a48ee3f155a6224c182e612dd5f187/03-transactions.md#per-commitment-secret-requirements)
9. Estimate a fee rate and set feerate_per_kw
10. Set to_self_delay to valid value (likely based on configuration)
11. Set HTLC limits for message (likely based on configuration)
