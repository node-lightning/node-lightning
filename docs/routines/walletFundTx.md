## Subroutine `walletFundTx`

Inputs:

-   `partialTx`

Wallet function that will spend one or more UTXOs to pay for the outputs in the transaction. This function is responsible for determining what the appropriate fee rate is for the transaction and attaching a change output.

This transaction should only use segwit BIP141 (SegWit) inputs to ensure the transaction is not malleable.

Additionally the transaction should enable opt-in full replace-by-fee by setting at least one input's nSequence value to 0xfffffffe or less. This is because if the funding transaction fails to confirm within 2016 blocks, the fundee (accepting node) will forget the channel.

The result of this function is a completed transaction that is ready for broadcast to the network.
