import { expect } from "chai";
import { bufLeftShift } from "../../lib/onion/bufLeftShift";

describe(".bufLeftShift()", () => {
    it("zero bytes", () => {
        const buf = Buffer.from("01020304", "hex");
        const res = bufLeftShift(buf, 0);
        expect(res.toString("hex")).to.equal("01020304");
    });

    it("several bytes", () => {
        const buf = Buffer.from("01020304", "hex");
        const res = bufLeftShift(buf, 2);
        expect(res.toString("hex")).to.equal("03040000");
    });

    it("all bytes", () => {
        const buf = Buffer.from("01020304", "hex");
        const res = bufLeftShift(buf, 4);
        expect(res.toString("hex")).to.equal("00000000");
    });
});
