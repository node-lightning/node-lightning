## 4.3. Block connected [remote commitment]

If we detect a block that spends the funding transaction via the remote commitment transaction we need to transition to a remote close and take appropriate action on outputs. This can really only occur after the funding transaction has been confirmed, but may occur in the window of blocks between the confirmation depth and the ready depth has been reached.
