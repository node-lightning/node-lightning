# Lightning Network Invoice Protocol Encoder/Decoder

[![CircleCI](https://circleci.com/gh/altangent/lightning-invoice/tree/master.svg?style=shield)](https://circleci.com/gh/altangent/lightning-invoice/tree/master)
[![Coverage Status](https://coveralls.io/repos/github/altangent/lightning-invoice/badge.svg?branch=master)](https://coveralls.io/github/altangent/lightning-invoice?branch=master)

A JavaScript invoice encoding/decoding library for the Bitcoin Lightning Network.

This library intends to be [BOLT #11](https://github.com/lightningnetwork/lightning-rfc/blob/master/11-payment-encoding.md) compliant.

This software is a work in progress. Use at your own risk.

## Usage

```javascript
let invoice = require('./index');
let result = invoice.decode('lnbc2500u1pvjluezpp5qqqsyqcyq5rqwzqfqqqsyqcyq5rqwzqfqqqsyqcyq5rqwzqfqypqdq5xysxxatsyp3k7enxv4jsxqzpuaztrnwngzn3kdzw5hydlzf03qdgm2hdq27cqv3agm2awhz5se903vruatfhq77w3ls4evs3ch9zw97j25emudupq63nyw24cg27h2rspfj9srp');
console.log(result);

/*
Invoice {
  network: 'bc',
  amount: 0.0025,
  timestamp: 1496314658,
  fields: 
   [ { type: 1,
       value: <Buffer 00 01 02 03 04 05 06 07 08 09 00 01 02 03 04 05 06 07 08 09 00 01 02 03 04 05 06 07 08 09 01 02> },
     { type: 13, value: '1 cup coffee' },
     { type: 6, value: 60 } ],
  unknownFields: [],
  signature: 
   { r: <Buffer e8 96 39 ba 68 14 e3 66 89 d4 b9 1b f1 25 f1 03 51 b5 5d a0 57 b0 06 47 a8 da ba eb 8a 90 c9 5f>,
     s: <Buffer 16 0f 9d 5a 6e 0f 79 d1 fc 2b 96 42 38 b9 44 e2 fa 4a a6 77 c6 f0 20 d4 66 47 2a b8 42 bd 75 0e>,
     recoveryFlag: 1 },
  pubkey: 
   { x: <Buffer e7 15 6a e3 3b 0a 20 8d 07 44 19 91 63 17 7e 90 9e 80 17 6e 55 d9 7a 2f 22 1e de 0f 93 4d d9 ad>,
     y: <Buffer 6e 0f 4e c2 fd db a7 ad 97 6b df 18 33 5e 46 4f 26 08 60 7e 3b 10 a5 6e 85 4a e0 81 62 1e bd e3> },
  hashData: <Buffer 3c d6 ef 07 74 40 40 55 6e 01 be 64 f6 8f d9 e1 56 5f b4 7d 78 c4 23 08 b1 ee 00 5a ca 5a 0d 86>,
  expiry: 60,
  paymentHash: <Buffer 00 01 02 03 04 05 06 07 08 09 00 01 02 03 04 05 06 07 08 09 00 01 02 03 04 05 06 07 08 09 01 02>,
  shortDesc: '1 cup coffee',
  hashDesc: undefined,
  payeeNode: undefined,
  minFinalCltvExpiry: 9,
  fallbackAddresses: [],
  routes: [] }
*/
```

## API

#### `.decode(string): Invoice`
Decodes a bech32 encoded lightning invoice. Exceptions are thrown for invalid invoices.

#### Class - `Invoice`
Represents a payment invoice that contains the following properties

* `network: String` - network prefix (Bitcoin Mainnet `bc`, Bitcoin Testnet `tb`, Bitcoin Regression `crt`, Bitcoin Simnet `sm`
* `amount: Float` - amount in bitcoin
* `timestamp: Int` - timestamp of the invoice
* `fields: Array` - raw fields that are known in BOLT 11 
* `unknownFields: Array` - raw fields that are unknown in BOLT 11
* `signature: Object` - signature in the format: `{ r: Buffer(32), s: Buffer(32), recoveryFlag: Int }` that was used to sign the invoice 
* `pubkey: Object` - pubkey in the format: `{ x: Buffer(32), y: Buffer(32) }` that was recovered from the signature or provided in an `n` field
* `hashData: Buffer(32)` - SHA256 of the data that was signed 
* `expiry: Int` - expiry time in seconds, defaults to 3600 (per BOLT 11)
* `paymentHash: Buffer(32)` - SHA256 of the payment_preimage provided in return for payment
* `shortDesc: String` - short description
* `hashDesc: Buffer(var)` - hash of the long description   
* `payeeNode: Buffer(33)`: optional pubkey of the payee node
* `minFinalCltvExpiry: Int`: `min_final_cltv_expiry` to use for the last node, defaults to 9 (per BOLT 11)
* `fallbackAddresses: Array`: list of on-chain addresses to fall back if payment fails in the format `{ version: Int, address: Buffer(var) }`, supports version 0, 17, 18 addresses
* `routes: Array`: list of routes that should be used in the format `{ pubkey: Buffer(33), short_channel_id: Buffer(8), fee_base_msat: Int, fee_proportional_millionths: Int, cltv_expiry_delta: Int }`


## Contributing

Contributions are welcome. Integrated tooling includes unit testing, linting, and formatting via Prettier. These command can be run via `npm test`, `npm run lint` and `npm run format`.

Before submitting PRs:

* Add appropriate test coverage for your issue
* Run `npm run validate` to ensure coding standards are followed
