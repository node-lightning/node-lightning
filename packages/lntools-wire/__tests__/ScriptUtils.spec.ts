import { expect } from "chai";
import { fundingScript } from "../lib/ScriptUtils";

describe("fundingScript", () => {
    it("funding script 1 < 2", () => {
        const pk1 = Buffer.alloc(32, 1);
        const pk2 = Buffer.alloc(32, 2);
        expect(fundingScript([pk1, pk2]).toString("hex")).to.equal(
            "0020c90193c6382d5ce558a53ea98e5e7354155858d2d2a4f4358a8dde945361df5b",
        );
    });

    it("funding script 2 < 1", () => {
        const pk1 = Buffer.alloc(32, 1);
        const pk2 = Buffer.alloc(32, 2);
        expect(fundingScript([pk2, pk1]).toString("hex")).to.equal(
            "0020c90193c6382d5ce558a53ea98e5e7354155858d2d2a4f4358a8dde945361df5b",
        );
    });
});
