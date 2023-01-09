## Subroutine `checkWalletHasFunds`

Inputs:

-   `funding_satoshis`

Verify with the wallet that sufficient funds are available for spending.

This implementation uses `listunspent` RPC call to obtain a list of UTXOs that are available for spending. It calculates the total available and if this is greater than our requested amount we return true.
