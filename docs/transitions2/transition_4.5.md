## 4.5. Block connected [expiry depth reached]

For the channel acceptor (fundee) the channel can be forgotten if the funding transaction fails to confirm within 2016 blocks after initiating the channel. This creates incentive for the creator (funder) to ensure the funding transaction is confirmed or else the channel becomes invalid and the funder will need to perform a unilateral close (see 41).

#### Condition

1. Expiry depth (2016 blocks) past channel initialization
