const { expect } = require("chai");
const OPS = require("bitcoin-ops");
const { hash160 } = require("@lntools/crypto");
const { compileScript } = require("../../lib/script/compile-script");
const { p2shScript } = require("../../lib/script/p2shScript");

describe("p2shScript", () => {
  let fixtures = [
    {
      assert: "non-standard script",
      input: hash160(
        compileScript([
          OPS.OP_SHA256,
          Buffer.from('253c853e2915f5979e3c6b248b028cc5e3b4e7be3d0884db6c3632fd85702def', 'hex'),
          OPS.OP_EQUAL,
        ]), // prettier-ignore
      ),
      expected: "a9140714c97d999d7e3f1c68b015fec735b857e9064987",
    },
    {
      assert: "p2sh(p2ms) script",
      input: hash160(
        Buffer.from(
          "522102e577d441d501cace792c02bfe2cc15e59672199e2195770a61fd3288fc9f934f2102c65e30c3ff38e79e3eb73cebe9c4747007b6eef4ee40a01fc53b991dfaf1838752ae",
          "hex",
        ),
      ),
      expected: "a91451a92be9c57d4b865e69daad982c5ab6c1d7bea187",
    },
    {
      assert: "p2sh(p2pkh) script",
      input: hash160(Buffer.from("76a914c34015187941b20ecda9378bb3cade86e80d2bfe88ac", "hex")),
      expected: "a91421478d4f1adfe18d59ccb5ca0e135fa6a5f3467687",
    },
  ];

  for (let { assert, input, expected } of fixtures) {
    it(assert, () => {
      let actual = p2shScript(input);
      expect(actual.toString("hex")).to.equal(expected);
    });
  }
});
