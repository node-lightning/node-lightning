## 12. Disconnect

Upon disconnect, we only need to remember the channel after we have broadcast the funding transaction when we are the funder or after sending `funding_signed` as the fundee.

Prior to this, if we disconnect from the peer for any reason, we can forget the channel and try to construct the channel again once we have reconnected.

We will transition to the `Failing` state of the `Channel` state machine.

#### Actions

1. Transition to `Failing` channel state

## 13. Receive `shutdown` message

If we receive a `shutdown` message from the peer prior to broadcasting the funding transaction (as the funder) or prior to sending `funding_signed` (as the fundee) we will fail the channel, which at this stage means simply abandoning it.

#### Actions:

1. Transition to `Failing` channel state
