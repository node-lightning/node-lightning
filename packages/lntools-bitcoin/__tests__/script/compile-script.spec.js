const { expect } = require('chai');
const OPS = require('bitcoin-ops');
const { compileScript } = require('../../lib/script/compile-script');

describe('compileScript', () => {
  let fixtures = [
    {
      assert: 'empty script',
      input: [],
      expected: '',
    },
    {
      assert: 'minimized 0',
      input: [Buffer.alloc(0)],
      expected: '00',
    },
    {
      assert: 'opcode 1negate',
      input: [Buffer.from([0x81])],
      expected: '4f',
    },
    {
      assert: 'opcode as value',
      input: [OPS.OP_CHECKSIG],
      expected: 'ac',
    },
    {
      assert: 'pushdata for buffers',
      input: [Buffer.alloc(5)],
      expected: '050000000000',
    },
  ];

  // special opcodes
  for (let i = 1; i <= 16; i++) {
    fixtures.push({
      assert: 'opcode reserved ' + i,
      input: [Buffer.from([i])],
      expected: Buffer.from([i + 80]).toString('hex'),
    });
  }

  for (let { assert, input, expected } of fixtures) {
    it(assert, () => {
      let actual = compileScript(input);
      expect(actual.toString('hex')).to.equal(expected);
    });
  }
});
