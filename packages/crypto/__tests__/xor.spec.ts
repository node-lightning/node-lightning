import { expect } from "chai";
import { xor } from "../lib/xor";

describe("xor", () => {
    it("equal length", () => {
        const a = Buffer.from("0101", "hex");
        const b = Buffer.from("0101", "hex");
        expect(xor(a, b).toString("hex")).to.equal("0000");
    });

    it("equal length", () => {
        const a = Buffer.from("ffff", "hex");
        const b = Buffer.from("0000", "hex");
        expect(xor(a, b).toString("hex")).to.equal("ffff");
    });

    it("shorter a", () => {
        const a = Buffer.from("ff", "hex");
        const b = Buffer.from("0000", "hex");
        expect(xor(a, b).toString("hex")).to.equal("ff");
    });

    it("shorter b", () => {
        const a = Buffer.from("ffff", "hex");
        const b = Buffer.from("00", "hex");
        expect(xor(a, b).toString("hex")).to.equal("ff");
    });
});
