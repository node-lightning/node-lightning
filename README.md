# Lightnode
[![CircleCI](https://circleci.com/gh/altangent/lightnode/tree/master.svg?style=shield)](https://circleci.com/gh/altangent/lightnode/tree/master)
[![codecov](https://codecov.io/gh/altangent/lightnode/branch/master/graph/badge.svg)](https://codecov.io/gh/altangent/lightnode)


The goal of Lightnode is to build composible modules of the Lightning Network specificiation. These modules can be combined into tools that can interact with the Lightning Network for research, testing, or building awesome things.

This module is not intended to be an alternative to LND, c-lightning, or Acinq.  

## Structure and Modules

Lightnode is structured as a monorepo with individual packages existing inside of `packages`.  Binaries will live inside `src`.

- [@lightnode/invoice](packages/lightnode-invoice) - encoding/decoding LN invoices
- [@lightnode/messages](packages/lightnode-messages) - encoding/decoding tools for network and channel management messages
- [@lightnode/wire](packages/lightnode-wire) - wire protocol for connecting peers


## BOLT Status
Current status of [Lightning RFC](https://github.com/lightningnetwork/lightning-rfc) specification implementation:
- [x] BOLT 1 - Base Protocol
- [ ] BOLT 2 - Peer Protocol for Channel Management
- [ ] BOLT 3 - Bitcoin Transaction and Script Format
- [ ] BOLT 4 - Onion Routing Protocol
- [ ] BOLT 5 - Recommendations for On-chain Transaction Handling
- [ ] BOLT 7 - P2P Node and Channel Discovery
- [x] BOLT 8 - Encrypted and Authenticated Transport: [@lightnode/wire](packages/lightnode-wire)
- [ ] BOLT 9 - Assigned Feature Flags
- [ ] BOLT 10 - DNS Bootstrap and Assisted Node Location
- [x] BOLT 11 - Invoice Protocol for Lightning Payments: [@lightnode/invoice](packages/lightnode-invoice)

## Contributing

Refer to the [contribution guide](CONTRIBUTING.md).

