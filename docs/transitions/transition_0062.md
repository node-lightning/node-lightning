## 62. Disconnect

#### Condition

We transition back to the return state that we were in prior to the reconnection.

### 62a. Return State is `awaiting_funding_depth`

#### Actions

1. Transition to `awaiting funding depth` state of the `Disconnected Channel Open` state machine.

### 62b. Return State is `awaiting_channel_ready`

#### Actions

1. Transition to `awaiting channel_ready` state of the `Disconnected Channel Open` state machine.
