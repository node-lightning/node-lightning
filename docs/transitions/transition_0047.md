## 47. Disconnect

While waiting for the funding depth to be reach we may disconnect from the peer. We then transition to the channel state of `Disconnected Open`

#### Actions

1. Transition to a `Disconnected Open` channel state with return state of `awaiting_funding_depth`
