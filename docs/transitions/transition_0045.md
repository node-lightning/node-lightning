## 45. Block connected [contains funding tx]

The channel acceptor (fundee) must validate the channel creator constructed the funding transaction in an agreed upon manner. This includes validating that the outpoint spends to the correct script and that the funding amount is correct. If the create fails to construct the funding transaction correctly, the acceptor (fundee) will fail the channel.

#### Condition

We need to validate the funding transaction output, as given in `funding_txid` and `funding_output_index` of `funding_created` message is correct.

1. Validate the fudning output - [`validateFundingOutput` subroutine]()

### 45a. Funding output [valid]

If the funding output is valid we simply stay in the same state `awaiting_funding_depth` and take no further action

### 45b. Funding output [invalid]

If the funding output is invalid, we need to be sure that we do not send `channel_ready` message and can now fail the channel.

#### Actions

1. Forget the channel by transitioning to `Failure` channel state
