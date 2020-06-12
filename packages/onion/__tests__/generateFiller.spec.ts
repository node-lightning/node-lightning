import { expect } from "chai";
import { generateFiller } from "../lib/generateFiller";

describe("generateFiller", () => {
    it("1 hop", () => {
        const padkey = Buffer.alloc(32);
        const numHops = 1;
        const hopSize = 64;
        const filler = generateFiller(padkey, numHops, hopSize);
        expect(filler.toString("hex")).to.equal("");
    });

    it("2 hop", () => {
        const padkey = Buffer.alloc(32);
        const numHops = 2;
        const hopSize = 32;
        const filler = generateFiller(padkey, numHops, hopSize);
        expect(filler.toString("hex")).to.equal("00".repeat(32));
    });

    it("3 hop", () => {
        const padkey = Buffer.alloc(32);
        const numHops = 3;
        const hopSize = 32;
        const filler = generateFiller(padkey, numHops, hopSize);
        expect(filler.toString("hex")).to.equal(
            "034e9e83e58a013af0e7352fb7908514e3b3d1040d0bb963b3954b636b5fd4bf0000000000000000000000000000000000000000000000000000000000000000",
        );
    });

    it("4 hop", () => {
        const padkey = Buffer.alloc(32);
        const numHops = 4;
        const hopSize = 32;
        const filler = generateFiller(padkey, numHops, hopSize);
        expect(filler.toString("hex")).to.equal(
            "1a7e8ee5083604518baf2b55bbd6ac6f58eb4c99a8bdccc5c1ab5e4d353c7071034e9e83e58a013af0e7352fb7908514e3b3d1040d0bb963b3954b636b5fd4bf0000000000000000000000000000000000000000000000000000000000000000",
        );
    });
});
