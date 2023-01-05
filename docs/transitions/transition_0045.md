## 45. Block connected [contains funding tx]

The channel acceptor (fundee) must validate the channel creator constructed the funding transaction in an agreed upon manner. This includes validating that the outpoint spends to the correct script and that the funding amount is correct. If the creator fails to construct the funding transaction correctly, the acceptor (fundee) will fail the channel.

For both the funder and fundee, we want to store the confirmation depth and calculate the ready depth once we see a valid confirmed funding transaction.

#### Condition

We need to validate the funding transaction output, as given in `funding_txid` and `funding_output_index` of `funding_created` message is correct.

1. Validate the funding output - [`validateFundingTx` subroutine](../routines/validateFundingTx.md)

### 45a. Funding output [valid]

If the funding output is valid we simply stay in the same state `awaiting_funding_depth` and take no further action

1. Store confirmation depth and calculate ready depth

### 45b. Funding output [invalid]

If the funding output is invalid, we need to be sure that we do not send `channel_ready` message and can now fail the channel.

#### Actions

1. Forget the channel by transitioning to `Failing` channel state
