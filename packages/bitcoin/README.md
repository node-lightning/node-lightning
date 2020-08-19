# @node-lightning/bitcoin

This package provides common Bitcoin functionality that would normally be in
a Bitcoin utility library such as:

-   transaction parsing
-   transaction building and signing

This module is designed to be a Bitcoin utility library without thirdparty
libraries. However, it currently has dependencies on pushdata-bitcoin and
bitcoin-ops.
