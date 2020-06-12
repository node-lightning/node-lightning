const { expect } = require("chai");
const { p2pkhScript } = require("../../lib/script/p2pkhScript");

describe("p2pkhScript", () => {
    let fixtures = [
        {
            assert: "standard script",
            input: Buffer.from("c34015187941b20ecda9378bb3cade86e80d2bfe", "hex"),
            expected: "76a914c34015187941b20ecda9378bb3cade86e80d2bfe88ac",
        },
    ];

    for (let { assert, input, expected } of fixtures) {
        it(assert, () => {
            let actual = p2pkhScript(input);
            expect(actual.toString("hex")).to.equal(expected);
        });
    }
});
