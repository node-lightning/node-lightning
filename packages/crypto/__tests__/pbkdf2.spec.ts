import { expect } from "chai";
import { pbkdf2 } from "../lib/pbkdf2";

describe(".pbkdf2()", () => {
    const key = Buffer.alloc(32, 0x01);
    const salt = Buffer.from("this is a salt", "utf-8");

    it("works with sha512", async () => {
        const result = await pbkdf2(key, salt, 2048, 64, "sha512");
        expect(result.toString("hex")).to.equal(
            "f1227248944da11e1563709e63ba9cac5cd9c71c7039dc4c4cd96bf294f2813f0bf95c0a92ac716a4fbde0438b6f0ba2ddb480f0b7b2b62a8d33b034207abb00",
        );
    });

    it("works with sha256", async () => {
        const result = await pbkdf2(key, salt, 2048, 32, "sha256");
        expect(result.toString("hex")).to.equal(
            "d735887c0ccfae3f10561e6db66935e6c42a1f7f46d17e8fdec018fb7b53e4f7",
        );
    });
});
