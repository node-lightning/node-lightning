## 1.3. Receive `shutdown` message

If we receive a `shutdown` message from the peer prior to broadcasting the funding transaction (as the funder) or prior to sending `funding_signed` (as the fundee) we will fail the channel, which at this stage means simply abandoning it.

#### Actions:

1. Transition to `Failing` channel state
