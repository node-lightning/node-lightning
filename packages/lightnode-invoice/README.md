# Lightning Network Invoice Protocol Encoder/Decoder

[![CircleCI](https://circleci.com/gh/altangent/lightning-invoice/tree/master.svg?style=shield)](https://circleci.com/gh/altangent/lightning-invoice/tree/master)
[![Coverage Status](https://coveralls.io/repos/github/altangent/lightning-invoice/badge.svg?branch=master)](https://coveralls.io/github/altangent/lightning-invoice?branch=master)

A JavaScript invoice encoding/decoding library for the Bitcoin Lightning Network.

This library intends to be [BOLT #11](https://github.com/lightningnetwork/lightning-rfc/blob/master/11-payment-encoding.md) compliant.

This software is a work in progress. Use at your own risk.

## Usage

```javascript
const invoice = require('lightning-invoice');
let invoice = invoice.decode(
  'lnbc2500u1pvjluezpp5qqqsyqcyq5rqwzqfqqqsyqcyq5rqwzqfqqqsyqcyq5rqwzqfqypqdq5xysxxatsyp3k7enxv4jsxqzpuaztrnwngzn3kdzw5hydlzf03qdgm2hdq27cqv3agm2awhz5se903vruatfhq77w3ls4evs3ch9zw97j25emudupq63nyw24cg27h2rspfj9srp'
);

/*
{ network: 'bc',
  amount: 0.0025,
  timestamp: 1496314658,
  data:
   [ { type: 1,
       data: <Buffer 00 01 02 03 04 05 06 07 08 09 00 01 02 03 04 05 06 07 08 09 00 01 02 03 04 05 06 07 08 09 01 02> },
     { type: 13, data: '1 cup coffee' },
     { type: 6, data: 60 } ],
  signature: <Buffer e8 96 39 ba 68 14 e3 66 89 d4 b9 1b f1 25 f1 03 51 b5 5d a0 57 b0 06 47 a8 da ba eb 8a 90 c9 5f 16 0f 9d 5a 6e 0f 79 d1 fc 2b 96 42 38 b9 44 e2 fa 4a ... > }
*/
```

## Contributing

Contributions are welcome. Integrated tooling includes unit testing, linting, and formatting via Prettier. These command can be run via `npm test`, `npm run lint` and `npm run format`.

Before submitting PRs:

* Add appropriate test coverage for your issue
* Run `npm run validate` ensure coding standards are followed
