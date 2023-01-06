## 57. Block connected [remote commitment]

If we detect a block that spends the funding transaction via the remote commitment transaction we need to transition to a remote close and take appropriate action on outputs.

#### Actions

1. Transition to `Remote Close` channel state
