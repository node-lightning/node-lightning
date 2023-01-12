## Subroutine `createFundingTx`

Inputs:

-   `Channel`
    -   `funding_satoshis`
    -   `funding_pubkey` from `open_channel`
    -   `funding_pubkey` from `accept_channel`

Calls:

-   `walletFundTx`

Constructs a partial transaction with one or more inputs sufficient to cover the `funding_satoshis` value. Contains one or more outputs, one of which must be the funding output. The funding transaction is defined [BOLT 3](https://github.com/lightning/bolts/blob/master/03-transactions.md#funding-transaction-output). This funding output must be a P2WSH output script matching:

    ```
    2 <pubkey1> <pubkey2> 2 OP_CHECKMULTISIG
    ```

-   The pubkeys are the lexicographical ordering of the `funding_pubkey` values from the `open_channel` and `accept_channel` messages. Lexicographical ordering improves privacy by not leaking which of the nodes is the funding node.
-   Once this transaction is created, we can use the outpoint (txid + output index). We will hold off on broadcasting the funding transaction until we have a valid commitment signature from our peer.
-   This transaction should only use segwit BIP141 (SegWit) inputs.
-   If the funding transaction fails to confirm within 2016 blocks, the fundee (accepting node) will forget the channel. As such it is recommended to include a change output that is eligible for fee bumping the funding transaction via CPFP

This function calls the bitcoin wallet to obtain inputs that are sufficient to cover the `fundingAmount` and ensure the funding transaction is confirmed immediately.

The result of this function is an immutable, ready-to-broadcast funding transaction.
