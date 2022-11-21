## 55. Receive `shutdown` message

If we receive a `shutdown` message from the peer we will cease channel operations and move to a `Mutual Close` channel state to close the channel.

#### Actions

1. Transition to `Mutual Close` channel state
