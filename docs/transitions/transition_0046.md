## 46. Receive `shutdown` message

A peer can send a `shutdown` message after it has sent `funding_created` (opener) or `funding_signed` (acceptor). While waiting for the funding depth to be reached the peer can send the `shutdown` message. We then transition to a mutual close.

#### Actions

1. Transition to `Mutual Close` channel state
