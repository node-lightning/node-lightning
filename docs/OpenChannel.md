# Transitions

## 1. Send _open_channel_ message

A node initiates a channel by sending the _open_channel_ message. The node must first construct the
message which has several parts.

**Action:** Construct _open_channel_ message based on [BOLT 2](https://github.com/lightning/bolts/blob/master/02-peer-protocol.md#the-open_channel-message).

1. Must set the chain_hash to the appropriate chain that the channel will be on
2. Must construct a temporary_channel_id unique with the peer
3. Must determine the funding_satoshis. This must be less than 2^24 satoshis if option_supprt_large_channel was
   not negotiated. The node should ensure that there are sufficient funds in the wallet to create a
   channel of this value. The value of the must be sufficient for full fee payment.
4. Must set push_msat <= 1000 \* funding_satoshi
5. Should set dust_limit_satoshis to a sufficient value to propagate transactions. This must be
   larger than 354 satoshis as calculated from [BOLT 3](https://github.com/lightning/bolts/blob/93909f67f6a48ee3f155a6224c182e612dd5f187/03-transactions.md#per-commitment-secret-requirements)
6. Must set channel_reserve_balance for use by the opposite node to be >= dust_limit_satoshis.
7. Must create a funding_pubkey, may obtain from LN wallet
8. Must construct the basepoints, may be derived from the LN wallet
9. Must obtain a seed and generate first_per_commitment_point based on
   [generation algorithm in BOLT 3](https://github.com/lightning/bolts/blob/93909f67f6a48ee3f155a6224c182e612dd5f187/03-transactions.md#per-commitment-secret-requirements). May be obtained from the LN wallet
10. Should set the feerate_per_kw to at least a rate that would get the transaction included
11. Set to_self_delay to valid value (likely based on configuration)
12. Must set max_accepted_htlcs <= 483
13. Must ensure that at least one of to_local and to_remote is > channel_reserve_balance.

## 2/3 Receive open_channel

A node may receive an open_channel messsage from a peer indicating the peer wishes to fund and
create a new channel.

**Condition**: Validate the recevied open_channel message as defined in [BOLT 2](https://github.com/lightning/bolts/blob/master/02-peer-protocol.md#the-open_channel-message).

1. Validate the chain_hash is recognized
2. Validate push_msat <= funding_sats \* 1000
3. Validate to_self_delay is reasonable (likely based on configuration)
4. Validate max_accepted_htlcs <= 483
5. Validate feerate_per_kw is reasonable, may be obtained from connected bitcon node
6. Validates funding_pubkey is valid key
7. Validate basepoints are valid secp256k1 public keys
8. Validates channel_reserve_balance >= dust_limit_satoshis
9. Validates dust_limit_satoshis is >= 354 satoshis
10. Fails if funder's amount for the initial commitment is not sufficient for full fee payment
11. Validates either to_local or to_remote is > channel_reserve_satoshis
12. Validates fudning_satoshis is < 2^24, unless option_support_large_channels was negotiated

## 2. Receive open_channel [valid]

**Action**: Construct an accept_channel message and send it to the peer. This message is constructed
accoring to [BOLT 2](https://github.com/lightning/bolts/blob/master/02-peer-protocol.md#the-accept_channel-message)

1. Must set temporary_channel_id as provided in open_channel
2. Must set dust_limit_satoshi <= channel_reserve_satoshis from the open channel message. May be
   based on values in [BOLT 3](https://github.com/lightning/bolts/blob/93909f67f6a48ee3f155a6224c182e612dd5f187/03-transactions.md#per-commitment-secret-requirements)
3. Must set channel_reserve_satoshis >= dust_limit_satoshis received in the open_channel message
4. Should max_htlc_value_in_flight_msat, htlc_minimum_msat, max_accepted_htlcs to values that
   you are willing to accept
5. Should set minimum_depth to a number of blocks it considers reasonable to avoid double-spends.
   Eg. 6 blocks.
6. Should set to_self_delay to a reasonable delay that the channel openener should before being able
   to access their funds if they broadcast their commitment transaction. Eg. 144.
7. Obtain funding key from LN wallet and will use pubkey as funding_pubkey
8. Obtain basepoints (may be derived from the LN wallet)
9. Obtain seed (from LN wallet) and generate first_per_commitment_point based on
   [generation algorithm in BOLT 3](https://github.com/lightning/bolts/blob/93909f67f6a48ee3f155a6224c182e612dd5f187/03-transactions.md#per-commitment-secret-requirements)
