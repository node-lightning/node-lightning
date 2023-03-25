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
