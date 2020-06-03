const { expect } = require("chai");
const { p2msScript } = require("../../lib/script/p2msScript");

describe("p2msScript", () => {
  let fixtures = [
    {
      assert: "2 of 2 multisig",
      input: {
        m: 2,
        n: 2,
        pubkeys: [
          Buffer.from("02e577d441d501cace792c02bfe2cc15e59672199e2195770a61fd3288fc9f934f", "hex"),
          Buffer.from("02c65e30c3ff38e79e3eb73cebe9c4747007b6eef4ee40a01fc53b991dfaf18387", "hex"),
        ],
      },
      expected:
        "522102e577d441d501cace792c02bfe2cc15e59672199e2195770a61fd3288fc9f934f2102c65e30c3ff38e79e3eb73cebe9c4747007b6eef4ee40a01fc53b991dfaf1838752ae",
    },
  ];

  for (let { assert, input, expected } of fixtures) {
    it(assert, () => {
      let { m, n, pubkeys } = input;
      let actual = p2msScript(m, n, pubkeys);
      expect(actual.toString("hex")).to.equal(expected);
    });
  }
});
