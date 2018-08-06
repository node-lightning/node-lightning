const sut = require('./encoder');
//const crypto = require('./crypto');

const privKey = Buffer.from(
  'e126f68f7eafcc8b74f54d269fe206be715000f94dac067d1c04a8ca3b2db734',
  'hex'
);

// test('it should have prefix', () => {
//   let invoice = {
//     network: 'bc',
//     amount: 0.00025,
//     timestamp: 1496314658,
//     fields: [
//       {
//         type: 1,
//         value: Buffer.from(
//           '0001020304050607080900010203040506070809000102030405060708090102',
//           'hex'
//         ),
//       },
//       // {
//       //   type: 13,
//       //   value: 'Please consider supporting this project',
//       // },
//     ],
//   };
//   let result = sut.encode(invoice, privKey);
//   expect(result.substring(0, result.length - 6)).toBe(
//     'lnbc1pvjluezpp5qqqsyqcyq5rqwzqfqqqsyqcyq5rqwzqfqqqsyqcyq5rqwzqfqypq'
//   );
// });

test('it should have prefix', () => {
  // let privkey = 'e126f68f7eafcc8b74f54d269fe206be715000f94dac067d1c04a8ca3b2db734';
  // let datahash = 'c3d4e83f646fa79a393d75277b1d858db1d1f7ab7137dcb7835db2ecd518e1c9';
  // //let sig = crypto.sign(datahash, privkey);

  // let key = ecdsa.keyFromPrivate(privkey);

  // console.log(key.getPublic());
  // console.log(key.verify(datahash, sig));

  let invoice = {
    network: 'bc',
    amount: 0.00025,
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
  expect(result.substring(0, result.length - 6)).toBe(
    'lnbc1pvjluezpp5qqqsyqcyq5rqwzqfqqqsyqcyq5rqwzqfqqqsyqcyq5rqwzqfqypqdpl2pkx2ctnv5sxxmmwwd5kgetjypeh2ursdae8g6twvus8g6rfwvs8qun0dfjkxaq'
  );
});
