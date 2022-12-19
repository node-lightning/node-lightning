## Subroutine `attachFundingSigned`

Inputs:

-   `channel`: `Channel`
-   `msg`: `FundingSignedMessage`

Adds the peers signature to the `Channel` object. This signature gets captured on our side of the channel for the next commitment transaction our side can use.
