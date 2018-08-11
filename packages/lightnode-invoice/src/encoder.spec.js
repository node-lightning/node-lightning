const sut = require('./encoder');
//const crypto = require('./crypto');

const privKey = Buffer.from(
  'e126f68f7eafcc8b74f54d269fe206be715000f94dac067d1c04a8ca3b2db734',
  'hex'
);

describe('amount encoder', () => {
  let tests = [
    [1, '1'],
    [0.1, '100m'],
    [0.01, '10m'],
    [0.001, '1m'],
    [0.0001, '100u'],
    [0.00001, '10u'],
    [0.000001, '1u'],
    [0.0000001, '100n'],
    [0.00000001, '10n'],
    [0.000000001, '1n'],
    [0.0000000001, '100p'],
    [0.00000000001, '10p'],
    [0.000000000001, '1p'],
    [0.0025, '2500u'],
    [1.0025, '1002500u'],
  ];
  for (let [input, expected] of tests) {
    it(`encode amount ${input.toFixed(12)} to ${expected}`, () => {
      expect(sut.encodeAmount(input)).toBe(expected);
    });
  }
});

describe('test vectors', () => {
  test('donation of any amount using payment_hash 0001020304050607080900010203040506070809000102030405060708090102 to me @03e7156ae33b0a208d0744199163177e909e80176e55d97a2f221ede0f934dd9ad', () => {
    let invoice = {
      network: 'bc',
      timestamp: 1496314658,
      fields: [
        {
          type: 1,
          value: Buffer.from(
            '0001020304050607080900010203040506070809000102030405060708090102',
            'hex'
          ),
        },
        {
          type: 13,
          value: 'Please consider supporting this project',
        },
      ],
    };
    let result = sut.encode(invoice, privKey);
    expect(result).toBe(
      'lnbc1pvjluezpp5qqqsyqcyq5rqwzqfqqqsyqcyq5rqwzqfqqqsyqcyq5rqwzqfqypqdpl2pkx2ctnv5sxxmmwwd5kgetjypeh2ursdae8g6twvus8g6rfwvs8qun0dfjkxaq8rkx3yf5tcsyz3d73gafnh3cax9rn449d9p5uxz9ezhhypd0elx87sjle52x86fux2ypatgddc6k63n7erqz25le42c4u4ecky03ylcqca784w'
    );
  });
});
