# LNTools

[![CircleCI](https://circleci.com/gh/altangent/lntools/tree/master.svg?style=shield)](https://circleci.com/gh/altangent/lntools/tree/master)
[![codecov](https://codecov.io/gh/altangent/lntools/branch/master/graph/badge.svg)](https://codecov.io/gh/altangent/lntools)

The goal of LNTools is to build composible modules of the Lightning Network specificiation. These modules can be combined into tools that can interact with the Lightning Network for research, testing, or building awesome things.

This module is not intended to be an alternative to LND, c-lightning, or Eclair.

## Structure and Modules

LNTools is structured as a monorepo with individual packages existing inside of `packages`.

- [@lntools/bitcoin](packages/lntools-bitcoin) - tools for building and parsing Bitcoin blocks and transactions
- [@lntools/bitcoind](packages/lntools-bitcoind) - bitcoind RPC and zeromq client
- [@lntools/buffer-cursor](packages/lntools-buffer-cursor) - utility for reading and writing Buffers
- [@lntools/crypto](packages/lntools-crypto) - common cryptography utilities
- [@lntools/graph](packages/lntools-gossip-rocksdb) - stores gossip messages in RocksDB
- [@lntools/graph](packages/lntools-graph) - maintains a Lightning Network P2P graph
- [@lntools/invoice](packages/lntools-invoice) - encoding/decoding Lightning Network invoices
- [@lntools/invoice](packages/lntools-logger) - logging utility
- [@lntools/noise](packages/lntools-noise) - Noise Protocol socket/server
- [@lntools/wire](packages/lntools-wire) - wire protocol for the Lightning Network

Examples of usage can be found inside `examples`

- [examples/graph](examples/graph) - full routing gossip synchronization

## BOLT Status

Current status of [Lightning RFC](https://github.com/lightningnetwork/lightning-rfc) specification implementation:

- [x] BOLT 1 - Base Protocol
- [ ] BOLT 2 - Peer Protocol for Channel Management
- [ ] BOLT 3 - Bitcoin Transaction and Script Format
- [ ] BOLT 4 - Onion Routing Protocol
- [ ] BOLT 5 - Recommendations for On-chain Transaction Handling
- [x] BOLT 7 - P2P Node and Channel Discovery: [@lntools/wire](packages/wire), [@lntools/graph](packages/graph)
- [x] BOLT 8 - Encrypted and Authenticated Transport: [@lntools/noise](packages/lntools-noise)
- [x] BOLT 9 - Assigned Feature Flags: [@lntools/wire](packages/wire)
- [ ] BOLT 10 - DNS Bootstrap and Assisted Node Location
- [x] BOLT 11 - Invoice Protocol for Lightning Payments: [@lntools/invoice](packages/lntools-invoice)

## Contributing

Refer to the [contribution guide](CONTRIBUTING.md).
