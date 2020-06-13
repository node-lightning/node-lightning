import { expect } from "chai";
import { bufRightShift } from "../lib/bufRightShift";

describe(".bufRightShift()", () => {
    it("zero bytes", () => {
        const buf = Buffer.from("01020304", "hex");
        const res = bufRightShift(buf, 0);
        expect(res.toString("hex")).to.equal("01020304");
    });

    it("several bytes", () => {
        const buf = Buffer.from("01020304", "hex");
        const res = bufRightShift(buf, 2);
        expect(res.toString("hex")).to.equal("00000102");
    });

    it("all bytes", () => {
        const buf = Buffer.from("01020304", "hex");
        const res = bufRightShift(buf, 4);
        expect(res.toString("hex")).to.equal("00000000");
    });
});
