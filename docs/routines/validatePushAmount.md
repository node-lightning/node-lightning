## Subroutine `validatePushAmount`

The rule as defined in BOLT 2 is that `push_msat` must be less than or equal to `funding_satoshis * 1000`. Since we are using the `Value` type (which already normalizes on amount) we simply ensure that the `pushAmount` is less than or equal to `fundingAmount`.

Note that in reality the `pushAmount` will be lower than this limit since the funder must also be able to pay for transaction fees. This rule is validated in `validateFunderFees`.

Inputs:

-   `fundingAmount`: `Value`
-   `pushAmount`: `Value`
