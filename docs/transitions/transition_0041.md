## 41. Block connected [approaching expiry depth]

The fundee (accepting node) will forget the node after 2016 blocks. After 2016 blocks, if the funding transaction is confirmed, the funding node will be forced to issue a unilateral close to recover their funds. As a result of this complication, the funding node needs to ensure the function transaction is confirmed within the 2016 blocks period.

#### Condition

1. Near expiry depth (2016 blocks)

#### Actions

1. Perform fee bump via Child-Pays-For-Parent (CPFP) - [`feeBumpTx` subroutine](../routines/feeBumpTx.md)
