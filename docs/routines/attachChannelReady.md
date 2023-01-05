## Subroutine `attachChannelReady`

Inputs:

-   `channel`: `Channel`
-   `msg`: `ChannelReadyMessage`

Stores the `second_per_commitment_point` received by the peer onto their side of the channel and rotates the next commitment information into the current position while establishing a new `next` position.
