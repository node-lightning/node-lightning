## 52. Block connected [max depth reached]

If we do not receive a `channel_ready` message from the peer within a reasonable amount of time we can transition to a failure state.

#### Actions

1. Transition to a `Failing` channel state
