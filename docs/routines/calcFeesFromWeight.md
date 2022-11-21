## Subroutine `calcFeesFromWeight`

Calculates the commitment transaction fees based on the weight and the `feerate_per_kw`.

Inputs:

-   Weight
-   `feerate_per_kw`

```
fees = weight * feerate_per_kw / 1000
```
