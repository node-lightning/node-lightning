import { expect } from "chai";
import { ShortChannelId } from "../lib/ShortChannelId";

describe("ShortChannelId", () => {
    describe(".toString", () => {
        it("should return a human readable string", () => {
            const input = new ShortChannelId(1288457, 3, 0);
            const actual = input.toString();
            expect(actual).to.equal("1288457x3x0");
        });
    });

    describe(".toBuffer", () => {
        it("should return a buffer with block as MSBs and voutIdx as LSBs", () => {
            const input = new ShortChannelId(1288457, 3, 0);
            const actual = input.toBuffer();
            expect(actual.toString("hex")).to.deep.equal("13a9090000030000");
        });
    });

    describe(".toNumber", () => {
        it("should return a number value representation of the buffer", () => {
            const input = new ShortChannelId(1288457, 3, 0);
            const actual = input.toNumber();
            expect(actual.toString(10)).to.equal("1416673453389578240");
        });
    });
});
