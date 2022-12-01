## Subroutine `createFundingSignedMessage`

Inputs:

-   `channel_info`

Calls:

-   `createChannelId`
-   `createRemoteCommitmentTx`
-   `signCommitmentTx`

The accepting node must construct the `funding_signed` message according to [BOLT 2](https://github.com/lightning/bolts/blob/master/02-peer-protocol.md#the-funding_signed-message).

1. Create the `channel_id` using the `createChannelId` subroutine using the `funding_outpoint` we received in `funding_created`
1. Construct the first `remote_commitment_tx` using `createRemoteCommitmentTx` using the `channel_info` and `commitment_number=0`.
1. Sign the commitment transaction using `signCommitmentTx` using the `local_funding_secret` and `remote_commitment_tx`.
1. Construct the `funding_signed` message using the `channel_id` and `signature`

## Subroutine `feeBumpTx`

Inputs:

-   `utxo`

Calls:

-   `getDustLimit`
-   `obtainUtxo`
-   `obtainChangeAddress`

Wallet method that will fee bump a transaction by performing CPFP on the specified outpoint. CPFP creates an aggregate fee based on the original transaction plus the fees for the spending transaction of a UTXO.

1. Calculate the fee rate necessary to get both transactions to immediately confirm
1. Obtain the node's dust limit
1. Obtain zero or more UTXOs needed to achieve the fee rate via the `obtainUtxo` methid with a required amount
1. Obtain a change address if required and if above the dust limit, by calling `obtainChangeAddress` subroutine
1. Construct a new transaction including the provided `uxto` and one ore more UTXOs controlled by the wallet such that the fee rate is sufficient
