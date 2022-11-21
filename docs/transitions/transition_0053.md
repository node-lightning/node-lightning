## 53. Disconnect

If we disconnect while waiting for the peer's `channel_ready` message there can be some ambiguity around whether they received our `channel_ready` message which will addressed upon reconnection by always resending our `channel_ready` message.

#### Actions

1. Transition to a `Disconnected Open` channel state with return state of `awaiting_channel_ready`
