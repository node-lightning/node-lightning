# LNTools

[![CircleCI](https://circleci.com/gh/altangent/lntools/tree/master.svg?style=shield)](https://circleci.com/gh/altangent/lntools/tree/master)
[![codecov](https://codecov.io/gh/altangent/lntools/branch/master/graph/badge.svg)](https://codecov.io/gh/altangent/nltools)

The goal of LNTools is to build composible modules of the Lightning Network specificiation. These modules can be combined into tools that can interact with the Lightning Network for research, testing, or building awesome things.

This module is not intended to be an alternative to LND, c-lightning, or Acinq.

## Structure and Modules

LNTools is structured as a monorepo with individual packages existing inside of `packages`. Binaries will live inside `src`.

- [@lntools/invoice](packages/lntools-invoice) - encoding/decoding LN invoices
- [@lntools/noise](packages/lntools-noise) - Noise Protocol socket/server
- [@lntools/wire](packages/lntools-wire) - wire protocol for the Lightning Network

## BOLT Status

Current status of [Lightning RFC](https://github.com/lightningnetwork/lightning-rfc) specification implementation:

- [x] BOLT 1 - Base Protocol
- [ ] BOLT 2 - Peer Protocol for Channel Management
- [ ] BOLT 3 - Bitcoin Transaction and Script Format
- [ ] BOLT 4 - Onion Routing Protocol
- [ ] BOLT 5 - Recommendations for On-chain Transaction Handling
- [ ] BOLT 7 - P2P Node and Channel Discovery
- [x] BOLT 8 - Encrypted and Authenticated Transport: [@lntools/noise](packages/lntools-noise)
- [ ] BOLT 9 - Assigned Feature Flags
- [ ] BOLT 10 - DNS Bootstrap and Assisted Node Location
- [x] BOLT 11 - Invoice Protocol for Lightning Payments: [@lntools/invoice](packages/lntools-invoice)

## Contributing

Refer to the [contribution guide](CONTRIBUTING.md).
