## Subroutine `createChannel`

Construct a channel instance for a channel opener. This method is based on rules in [BOLT 2](https://github.com/lightning/bolts/blob/master/02-peer-protocol.md#the-open_channel-message) for construction of an `open_channel` message which will be performed using the channel in the `createOpenChannelMessage` subroutine.

Inputs:

-   `chain_hash`
-   `funding_satoshis`
-   `push_msat`
-   `min_htlc_value`
-   `max_htlc_in_flight_value`
-   `max_accepted_htlcs`
-   `channel_reserve_value`
-   `to_self_block_delay`
-   `public_channel`

Calls:

-   `checkWalletHasFunds`
-   `createTempChannelId`
-   `getFeeRatePerKw`
-   `validateFundingAmountMax`
-   `validatePushAmount`
-   `validateFunderFees`
-   `getDustLimit`
-   `validateDustLimitTooSmall`
-   `validateChannelReserveDustLimit`
-   `validateChannelReserveReachable`
-   `validateMaxAcceptedHtlcsTooLarge`
-   `createFundingKey`
-   `createBasePointSecrets`
-   `createPerCommitmentSeed`
-   `createPerCommitmentSecret`

1. Must validate the `funding_satoshis` is available in the wallet by calling `checkWalletHasFunds` subroutine.
1. Must set `chain_hash` to the appropriate value for the the chain the node wishes to create the channel on. This value is usually the genesis block in internal byte order of the block hash (little-endian).
1. Must construct a `temporary_channel_id` that is unique to other channel ids with the same peer using the `createTempChannelId` subroutine.
1. Should set the `feerate_per_kw` to at least a rate that would get the transaction immediately included in a block by calling `getFeeRatePerKw`.
1. Must validate that `funding_satoshis` is is less than 2^24 when `option_channel_support_large_channels` has not been negotiated with the peer by calling `validateFundingAmountMax`.
1. Must set `push_msat` <= 1000 \* `funding_satoshi` by calling `validatePushAmount`
1. Must validate that the `funding_satoshis` and `push_amt` is sufficient for full fee payment of the initial commitment transaction. This should be `724 * feerate_per_kw / 1000` by calling `validateFunderFees`.
1. Should set `dust_limit_satoshis` to a value sufficient to propagate transactions is sufficient to propagate transactions by checking with the Bitcoin node using `getDustLimit` subroutine.
1. Must set `dust_limit_satoshis` \>= 354 satoshis as calculated from [BOLT 3](https://github.com/lightning/bolts/blob/93909f67f6a48ee3f155a6224c182e612dd5f187/03-transactions.md#per-commitment-secret-requirements) by calling `validateDustLimitTooSmall`
1. Must set `channel_reserve_balance` for use by the opposite node.
1. Must set `channel_reserve_balance` >= sent `dust_limit_satoshis` value by calling `validateChannelReserveDustLimit`
1. Must ensure that at least one of `to_local` and `to_remote` outputs is > `channel_reserve_balance` by calling `validateChannelReserveReachable`
1. Should set `to_self_delay` to a value in blocks it wishes to delay the peer's access to its funds in the event it broadcasts its version of the commitment transaction.
1. Should set `htlc_mimimum_msat` to the minimum value HTLC it is willing to accept from the peer
1. Should set `max_acccepted_htlcs` to the maximum value of HTLCs it is will to accept from the peer.
1. Must set `max_accepted_htlcs` <= 483 and validate by calling `validateMaxAcceptedHtlcsTooLarge`
1. Should set `max_htlc_value_in_flight_msat` to the maximum millisatoshi value your are willing to allow for all HTLCs that are outstanding (both offerred and accepted).
1. Must create a `funding_pubkey` that is a valid point using the `createFundingKey` subroutine.
1. Must construct unique and unguessable secrets and generate valid public keys for `payment_basepoint_`, `_delayed_payment_basepoint_`, `_htlc_basepoint` and `_revocation_basepoint_` by calling the `createBasePointSecrets`.
1. Must obtain a unique and unguessable seed using `createPerCommitmentSeed` subroutine.
1. Must generate `first_per_commitment_point` by calling`createPerCommitmentSecret` subroutine and converting the secret into a valid curve point.

**Notes:**
Does not include notes for `option_support_large_channel`, `option_upfront_shutdown_script` or `option_channel_type`.
