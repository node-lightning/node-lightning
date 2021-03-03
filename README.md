<p align="center">
  <img width="150" src="assets/node-lightning-logo.svg" width="100" alt="Node Lightning logo">
</p>

<h1 align="center">Node-Lightning (formerly LNTools)</h1>

<div align="center">

[![Node.js CI](https://github.com/altangent/node-lightning/workflows/Node.js%20CI/badge.svg)](https://github.com/altangent/node-lightning/actions?query=workflow%3A%22Node.js+CI%22+branch%3Amaster)
[![codecov](https://codecov.io/gh/altangent/node-lightning/branch/master/graph/badge.svg)](https://codecov.io/gh/altangent/node-lightning)

</div>

## About the Project

Node-Lightning is an implementation of the Bitcoin Lightning Network in the Node.js runtime. The goal of this project is to implement the BOLT specifications to enable testing, research, and education. This project is not intended to replace or compete with the major implementations, though our hope is that the implementation will be fully functional.

This library contains the core packages and several examples. There is currently no runtime for this project.

The architecture philosophies for packages is:

1. _Minimize external dependencies_ - the Node.js ecosystem is rife with excess dependency usage. This project attempts to minimize the usage of external depedencies as much as possible (there are very few external modules in use at this point).
2. _Reduce complexity using semi-formalized state machines_ - the Lightning Network is a complex beast. It is very difficult to reason about code that has high cyclomatic complexity. To reduce cognitive load, allow for isolated testing, and enable composibility and extensibility, code is frequently broken into state machines and combined with concepts from [state charts](https://statecharts.github.io/). This library is not using metaprogramming techniques, though we are using many of the concepts. This enables the last point.
3. _Engineer for modular composibility_ - The goal is to enable composibility of various state machines which enables swapping out implementations or direct extensibility of complex processes.

The goal of this project is ambitious and there is a still a long road ahead. Refer to issues and the wiki for more information on how this project is structured and how you can [contribute](CONTRIBUTING.md).

## Structure and Modules

Node-Lightning is structured as a monorepo with individual packages existing inside of `packages`.

-   [@node-lightning/bitcoin](packages/bitcoin) - tools for building and parsing Bitcoin blocks and transactions
-   [@node-lightning/bitcoind](packages/bitcoind) - bitcoind RPC and zeromq client
-   [@node-lightning/bufio](packages/bufio) - utilities for working with Buffers
-   [@node-lightning/chainmon](packages/chainmon) - transaction and block monitoring tools
-   [@node-lightning/checksum](packages/checksum) - implements checksums such as CRC32C
-   [@node-lightning/core](packages/core) - implements shared lightning functionality
-   [@node-lightning/crypto](packages/crypto) - common cryptography utilities
-   [@node-lightning/gossip-rocksdb](packages/gossip-rocksdb) - stores gossip messages in RocksDB
-   [@node-lightning/graph](packages/graph) - builds and maintains a routing graph
-   [@node-lightning/invoice](packages/invoice) - encoding/decoding for invoices
-   [@node-lightning/logger](packages/logger) - logging utility
-   [@node-lightning/noise](packages/noise) - Noise Protocol socket/server
-   [@node-lightning/wire](packages/wire) - wire protocol and gossip
-   [@node-lightning/onion](packages/onion) - onion routing for payments

Examples of usage can be found inside `examples`

-   [examples/peer](examples/peer) - simple peer connection
-   [examples/gossip](examples/gossip) - gossip using gossip queries
-   [examples/graph](examples/graph) - full gossip, storage, and graph construction

## BOLT Status

Current status of [Lightning RFC](https://github.com/lightningnetwork/lightning-rfc) specification implementation:

-   [x] BOLT 1 - Base Protocol
-   [ ] BOLT 2 - Peer Protocol for Channel Management
-   [x] BOLT 3 - Bitcoin Transaction and Script Format: [@node-lightning/bitcoin](packages/bitcoin), [@node-lightning/core](packages/core)
-   [ ] BOLT 4 - Onion Routing Protocol
-   [ ] BOLT 5 - Recommendations for On-chain Transaction Handling
-   [x] BOLT 7 - P2P Node and Channel Discovery: [@node-lightning/wire](packages/wire), [@node-lightning/graph](packages/graph)
-   [x] BOLT 8 - Encrypted and Authenticated Transport: [@node-lightning/noise](packages/noise)
-   [x] BOLT 9 - Assigned Feature Flags: [@node-lightning/wire](packages/wire)
-   [ ] BOLT 10 - DNS Bootstrap and Assisted Node Location
-   [x] BOLT 11 - Invoice Protocol for Lightning Payments: [@node-lightning/invoice](packages/invoice)
