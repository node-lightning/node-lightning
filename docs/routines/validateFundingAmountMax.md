## Subrouting `validateFundingAmountMax`

Validates that the funding amount is less than 2^24 if the peers have not negotiated `option_support_large_channel`. If they have than any amount is valid.

Inputs:

-   `fundingAmount`: `Value`
-   `local`: `BitField<InitFeatureFlags>`
-   `remote`: `BitField<InitFeatureFlags>`
