const bs58check = require('bs58check');
const bech32 = require('bech32');
const sut = require('./encoder');
const { sha256 } = require('./crypto');
const Invoice = require('./invoice');

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
    [1.000200501, '1000200501n'],
  ];
  for (let [input, expected] of tests) {
    it(`encode amount ${input.toFixed(12)} to ${expected}`, () => {
      expect(sut.encodeAmount(input)).toBe(expected);
    });
  }
});

describe('test vectors', () => {
  test('donation of any amount using payment_hash 0001020304050607080900010203040506070809000102030405060708090102 to me @03e7156ae33b0a208d0744199163177e909e80176e55d97a2f221ede0f934dd9ad', () => {
    let invoice = Invoice.create({
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
    });
    let result = sut.encode(invoice, privKey);
    expect(result).toBe(
      'lnbc1pvjluezpp5qqqsyqcyq5rqwzqfqqqsyqcyq5rqwzqfqqqsyqcyq5rqwzqfqypqdpl2pkx2ctnv5sxxmmwwd5kgetjypeh2ursdae8g6twvus8g6rfwvs8qun0dfjkxaq8rkx3yf5tcsyz3d73gafnh3cax9rn449d9p5uxz9ezhhypd0elx87sjle52x86fux2ypatgddc6k63n7erqz25le42c4u4ecky03ylcqca784w'
    );
  });

  test('Please send $3 for a cup of coffee to the same peer, within 1 minute', () => {
    let invoice = Invoice.create({
      network: 'bc',
      timestamp: 1496314658,
      amount: 0.0025,
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
          value: '1 cup coffee',
        },
        {
          type: 6,
          value: 60,
        },
      ],
    });
    let result = sut.encode(invoice, privKey);
    expect(result).toBe(
      'lnbc2500u1pvjluezpp5qqqsyqcyq5rqwzqfqqqsyqcyq5rqwzqfqqqsyqcyq5rqwzqfqypqdq5xysxxatsyp3k7enxv4jsxqzpuaztrnwngzn3kdzw5hydlzf03qdgm2hdq27cqv3agm2awhz5se903vruatfhq77w3ls4evs3ch9zw97j25emudupq63nyw24cg27h2rspfj9srp'
    );
  });

  test('Please send 0.0025 BTC for a cup of nonsense (ナンセンス 1杯) to the same peer, within 1 minute', () => {
    let invoice = Invoice.create({
      network: 'bc',
      timestamp: 1496314658,
      amount: 0.0025,
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
          value: 'ナンセンス 1杯',
        },
        {
          type: 6,
          value: 60,
        },
      ],
    });
    let result = sut.encode(invoice, privKey);
    expect(result).toBe(
      'lnbc2500u1pvjluezpp5qqqsyqcyq5rqwzqfqqqsyqcyq5rqwzqfqqqsyqcyq5rqwzqfqypqdpquwpc4curk03c9wlrswe78q4eyqc7d8d0xqzpuyk0sg5g70me25alkluzd2x62aysf2pyy8edtjeevuv4p2d5p76r4zkmneet7uvyakky2zr4cusd45tftc9c5fh0nnqpnl2jfll544esqchsrny'
    );
  });

  test('Now send $24 for an entire list of things (hashed)', () => {
    let invoice = Invoice.create({
      network: 'bc',
      timestamp: 1496314658,
      amount: 0.02,
      fields: [
        {
          type: 1,
          value: Buffer.from(
            '0001020304050607080900010203040506070809000102030405060708090102',
            'hex'
          ),
        },
        {
          type: 23,
          value: sha256(
            Buffer.from(
              'One piece of chocolate cake, one icecream cone, one pickle, one slice of swiss cheese, one slice of salami, one lollypop, one piece of cherry pie, one sausage, one cupcake, and one slice of watermelon'
            )
          ),
        },
      ],
    });
    let result = sut.encode(invoice, privKey);
    expect(result).toBe(
      'lnbc20m1pvjluezpp5qqqsyqcyq5rqwzqfqqqsyqcyq5rqwzqfqqqsyqcyq5rqwzqfqypqhp58yjmdan79s6qqdhdzgynm4zwqd5d7xmw5fk98klysy043l2ahrqscc6gd6ql3jrc5yzme8v4ntcewwz5cnw92tz0pc8qcuufvq7khhr8wpald05e92xw006sq94mg8v2ndf4sefvf9sygkshp5zfem29trqq2yxxz7'
    );
  });

  test('The same, on testnet, with a fallback address mk2QpYatsKicvFVuTAQLBryyccRXMUaGHP', () => {
    let invoice = Invoice.create({
      network: 'tb',
      timestamp: 1496314658,
      amount: 0.02,
      fields: [
        {
          type: 23,
          value: sha256(
            Buffer.from(
              'One piece of chocolate cake, one icecream cone, one pickle, one slice of swiss cheese, one slice of salami, one lollypop, one piece of cherry pie, one sausage, one cupcake, and one slice of watermelon'
            )
          ),
        },
        {
          type: 1,
          value: Buffer.from(
            '0001020304050607080900010203040506070809000102030405060708090102',
            'hex'
          ),
        },
        {
          type: 9,
          value: {
            type: 17,
            address: bs58check.decode('mk2QpYatsKicvFVuTAQLBryyccRXMUaGHP').slice(1),
          },
        },
      ],
    });
    let result = sut.encode(invoice, privKey);
    expect(result).toBe(
      'lntb20m1pvjluezhp58yjmdan79s6qqdhdzgynm4zwqd5d7xmw5fk98klysy043l2ahrqspp5qqqsyqcyq5rqwzqfqqqsyqcyq5rqwzqfqqqsyqcyq5rqwzqfqypqfpp3x9et2e20v6pu37c5d9vax37wxq72un98kmzzhznpurw9sgl2v0nklu2g4d0keph5t7tj9tcqd8rexnd07ux4uv2cjvcqwaxgj7v4uwn5wmypjd5n69z2xm3xgksg28nwht7f6zspwp3f9t'
    );
  });

  test('On mainnet, with fallback address 1RustyRX2oai4EYYDpQGWvEL62BBGqN9T with extra routing info to go via nodes 029e03a901b85534ff1e92c43c74431f7ce72046060fcf7a95c37e148f78c77255 then 039e03a901b85534ff1e92c43c74431f7ce72046060fcf7a95c37e148f78c77255', () => {
    let invoice = Invoice.create({
      network: 'bc',
      timestamp: 1496314658,
      amount: 0.02,
      fields: [
        {
          type: 1,
          value: Buffer.from(
            '0001020304050607080900010203040506070809000102030405060708090102',
            'hex'
          ),
        },
        {
          type: 23,
          value: sha256(
            Buffer.from(
              'One piece of chocolate cake, one icecream cone, one pickle, one slice of swiss cheese, one slice of salami, one lollypop, one piece of cherry pie, one sausage, one cupcake, and one slice of watermelon'
            )
          ),
        },
        {
          type: 9,
          value: {
            type: 17,
            address: bs58check.decode('1RustyRX2oai4EYYDpQGWvEL62BBGqN9T').slice(1),
          },
        },
        {
          type: 3,
          value: [
            {
              pubkey: Buffer.from(
                '029e03a901b85534ff1e92c43c74431f7ce72046060fcf7a95c37e148f78c77255',
                'hex'
              ),
              short_channel_id: Buffer.from('0102030405060708', 'hex'),
              fee_base_msat: 1,
              fee_proportional_millionths: 20,
              cltv_expiry_delta: 3,
            },
            {
              pubkey: Buffer.from(
                '039e03a901b85534ff1e92c43c74431f7ce72046060fcf7a95c37e148f78c77255',
                'hex'
              ),
              short_channel_id: Buffer.from('030405060708090a', 'hex'),
              fee_base_msat: 2,
              fee_proportional_millionths: 30,
              cltv_expiry_delta: 4,
            },
          ],
        },
      ],
    });
    let result = sut.encode(invoice, privKey);
    expect(result).toBe(
      'lnbc20m1pvjluezpp5qqqsyqcyq5rqwzqfqqqsyqcyq5rqwzqfqqqsyqcyq5rqwzqfqypqhp58yjmdan79s6qqdhdzgynm4zwqd5d7xmw5fk98klysy043l2ahrqsfpp3qjmp7lwpagxun9pygexvgpjdc4jdj85fr9yq20q82gphp2nflc7jtzrcazrra7wwgzxqc8u7754cdlpfrmccae92qgzqvzq2ps8pqqqqqqpqqqqq9qqqvpeuqafqxu92d8lr6fvg0r5gv0heeeqgcrqlnm6jhphu9y00rrhy4grqszsvpcgpy9qqqqqqgqqqqq7qqzqj9n4evl6mr5aj9f58zp6fyjzup6ywn3x6sk8akg5v4tgn2q8g4fhx05wf6juaxu9760yp46454gpg5mtzgerlzezqcqvjnhjh8z3g2qqdhhwkj'
    );
  });

  test('On mainnet, with fallback (P2SH) address 3EktnHQD7RiAE6uzMj2ZifT9YgRrkSgzQX', () => {
    let invoice = Invoice.create({
      network: 'bc',
      timestamp: 1496314658,
      amount: 0.02,
      fields: [
        {
          type: 23,
          value: sha256(
            Buffer.from(
              'One piece of chocolate cake, one icecream cone, one pickle, one slice of swiss cheese, one slice of salami, one lollypop, one piece of cherry pie, one sausage, one cupcake, and one slice of watermelon'
            )
          ),
        },
        {
          type: 1,
          value: Buffer.from(
            '0001020304050607080900010203040506070809000102030405060708090102',
            'hex'
          ),
        },
        {
          type: 9,
          value: {
            type: 18,
            address: bs58check.decode('3EktnHQD7RiAE6uzMj2ZifT9YgRrkSgzQX').slice(1),
          },
        },
      ],
    });
    let result = sut.encode(invoice, privKey);
    expect(result).toBe(
      'lnbc20m1pvjluezhp58yjmdan79s6qqdhdzgynm4zwqd5d7xmw5fk98klysy043l2ahrqspp5qqqsyqcyq5rqwzqfqqqsyqcyq5rqwzqfqqqsyqcyq5rqwzqfqypqfppj3a24vwu6r8ejrss3axul8rxldph2q7z9kmrgvr7xlaqm47apw3d48zm203kzcq357a4ls9al2ea73r8jcceyjtya6fu5wzzpe50zrge6ulk4nvjcpxlekvmxl6qcs9j3tz0469gq5g658y'
    );
  });

  test('On mainnet, with fallback (P2WPKH) address bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4', () => {
    let invoice = Invoice.create({
      network: 'bc',
      timestamp: 1496314658,
      amount: 0.02,
      fields: [
        {
          type: 23,
          value: sha256(
            Buffer.from(
              'One piece of chocolate cake, one icecream cone, one pickle, one slice of swiss cheese, one slice of salami, one lollypop, one piece of cherry pie, one sausage, one cupcake, and one slice of watermelon'
            )
          ),
        },
        {
          type: 1,
          value: Buffer.from(
            '0001020304050607080900010203040506070809000102030405060708090102',
            'hex'
          ),
        },
        {
          type: 9,
          value: {
            type: bech32.decode('bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4').words[0],
            address: bech32.fromWords(
              bech32.decode('bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4').words.slice(1)
            ),
          },
        },
      ],
    });
    let result = sut.encode(invoice, privKey);
    expect(result).toBe(
      'lnbc20m1pvjluezhp58yjmdan79s6qqdhdzgynm4zwqd5d7xmw5fk98klysy043l2ahrqspp5qqqsyqcyq5rqwzqfqqqsyqcyq5rqwzqfqqqsyqcyq5rqwzqfqypqfppqw508d6qejxtdg4y5r3zarvary0c5xw7kepvrhrm9s57hejg0p662ur5j5cr03890fa7k2pypgttmh4897d3raaq85a293e9jpuqwl0rnfuwzam7yr8e690nd2ypcq9hlkdwdvycqa0qza8'
    );
  });

  test('On mainnet, with fallback (P2WSH) address bc1qrp33g0q5c5txsp9arysrx4k6zdkfs4nce4xj0gdcccefvpysxf3qccfmv3', () => {
    let invoice = Invoice.create({
      network: 'bc',
      timestamp: 1496314658,
      amount: 0.02,
      fields: [
        {
          type: 23,
          value: sha256(
            Buffer.from(
              'One piece of chocolate cake, one icecream cone, one pickle, one slice of swiss cheese, one slice of salami, one lollypop, one piece of cherry pie, one sausage, one cupcake, and one slice of watermelon'
            )
          ),
        },
        {
          type: 1,
          value: Buffer.from(
            '0001020304050607080900010203040506070809000102030405060708090102',
            'hex'
          ),
        },
        {
          type: 9,
          value: {
            type: bech32.decode('bc1qrp33g0q5c5txsp9arysrx4k6zdkfs4nce4xj0gdcccefvpysxf3qccfmv3')
              .words[0],
            address: bech32.fromWords(
              bech32
                .decode('bc1qrp33g0q5c5txsp9arysrx4k6zdkfs4nce4xj0gdcccefvpysxf3qccfmv3')
                .words.slice(1)
            ),
          },
        },
      ],
    });
    let result = sut.encode(invoice, privKey);
    expect(result).toBe(
      'lnbc20m1pvjluezhp58yjmdan79s6qqdhdzgynm4zwqd5d7xmw5fk98klysy043l2ahrqspp5qqqsyqcyq5rqwzqfqqqsyqcyq5rqwzqfqqqsyqcyq5rqwzqfqypqfp4qrp33g0q5c5txsp9arysrx4k6zdkfs4nce4xj0gdcccefvpysxf3q28j0v3rwgy9pvjnd48ee2pl8xrpxysd5g44td63g6xcjcu003j3qe8878hluqlvl3km8rm92f5stamd3jw763n3hck0ct7p8wwj463cql26ava'
    );
  });
});
