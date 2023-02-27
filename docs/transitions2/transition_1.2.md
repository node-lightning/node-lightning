## 1.2. Disconnect

Upon disconnect, we only need to remember the channel after we have broadcast the funding transaction when we are the funder or after sending `funding_signed` as the fundee.

Prior to this, if we disconnect from the peer for any reason, we can forget the channel and try to construct the channel again once we have reconnected.

We will transition to the `Failing` state of the `Channel` state machine.

#### Actions

1. Transition to `Failing` channel state
