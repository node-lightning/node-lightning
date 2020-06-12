# LNTools

[![CircleCI](https://circleci.com/gh/altangent/lntools/tree/master.svg?style=shield)](https://circleci.com/gh/altangent/lntools/tree/master)
[![codecov](https://codecov.io/gh/altangent/lntools/branch/master/graph/badge.svg)](https://codecov.io/gh/altangent/lntools)

The goal of LNTools is to build composible modules of the Lightning Network specificiation. These modules can be combined into tools that can interact with the Lightning Network for research, testing, or building awesome things.

This module is not intended to be an alternative to LND, c-lightning, or Eclair.

## Structure and Modules

LNTools is structured as a monorepo with individual packages existing inside of `packages`.

-   [@lntools/bitcoin](packages/bitcoin) - tools for building and parsing Bitcoin blocks and transactions
-   [@lntools/bitcoind](packages/bitcoind) - bitcoind RPC and zeromq client
-   [@lntools/buffer-cursor](packages/buffer-cursor) - utility for reading and writing Buffers
-   [@lntools/chainmon](packages/chainmon) - transaction and block monitoring tools
-   [@lntools/crypto](packages/crypto) - common cryptography utilities
-   [@lntools/gossip-rocksdb](packages/gossip-rocksdb) - stores gossip messages in RocksDB
-   [@lntools/graph](packages/graph) - builds and maintains a Lightning Network routing graph
-   [@lntools/invoice](packages/invoice) - encoding/decoding Lightning Network invoices
-   [@lntools/logger](packages/logger) - logging utility
-   [@lntools/noise](packages/noise) - Noise Protocol socket/server
-   [@lntools/wire](packages/wire) - wire protocol and gossipfor the Lightning Network

Examples of usage can be found inside `examples`

-   [examples/peer](examples/peer) - simple peer connectiono example
-   [examples/gossip](examples/gossip) - basic gossip example
-   [examples/graph](examples/graph) - full gossip, storage, and graph construction example

## BOLT Status

Current status of [Lightning RFC](https://github.com/lightningnetwork/lightning-rfc) specification implementation:

-   [x] BOLT 1 - Base Protocol
-   [ ] BOLT 2 - Peer Protocol for Channel Management
-   [ ] BOLT 3 - Bitcoin Transaction and Script Format
-   [ ] BOLT 4 - Onion Routing Protocol
-   [ ] BOLT 5 - Recommendations for On-chain Transaction Handling
-   [x] BOLT 7 - P2P Node and Channel Discovery: [@lntools/wire](packages/wire), [@lntools/graph](packages/graph)
-   [x] BOLT 8 - Encrypted and Authenticated Transport: [@lntools/noise](packages/noise)
-   [x] BOLT 9 - Assigned Feature Flags: [@lntools/wire](packages/wire)
-   [ ] BOLT 10 - DNS Bootstrap and Assisted Node Location
-   [x] BOLT 11 - Invoice Protocol for Lightning Payments: [@lntools/invoice](packages/invoice)

## Contributing

Refer to the [contribution guide](CONTRIBUTING.md).
