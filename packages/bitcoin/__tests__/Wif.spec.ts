import { expect } from "chai";
import { Network } from "../lib";
import { Wif } from "../lib/Wif";

describe("Wif", () => {
    describe(".encode()", () => {
        it("5003 (compressed, testnet)", () => {
            const pk = Buffer.from("000000000000000000000000000000000000000000000000000000000000138b", "hex"); // prettier-ignore
            expect(Wif.encode(Network.testnet, pk, true)).to.equal("cMahea7zqjxrtgAbB7LSGbcQUr1uX1ojuat9jZodMN8rFTv2sfUK"); // prettier-ignore
        });

        it("2021^5 (uncompressed, testnet)", () => {
            const pk = Buffer.from("0000000000000000000000000000000000000000000000000077c8350c02b595", "hex"); // prettier-ignore
            expect(Wif.encode(Network.testnet, pk, false)).to.equal("91avARGdfge8E4tZfYLoxeJ5sGBdNJQH4kvjpWAxgzczjbCwxic"); // prettier-ignore
        });

        it("0x54321deadbeef (compressed, mainnet)", () => {
            const pk = Buffer.from("00000000000000000000000000000000000000000000000000054321deadbeef", "hex"); // prettier-ignore
            expect(Wif.encode(Network.mainnet, pk, true)).to.equal("KwDiBf89QgGbjEhKnhXJuH7LrciVrZi3qYjgiuQJv1h8Ytr2S53a"); // prettier-ignore
        });
    });

    describe(".decode()", () => {
        it("throws with invalid encoding", () => {
            expect(() =>
                Wif.decode("3h3zMzbApV7gNBmKbAeTXz91GgngcP8vwKhxSn9mW6Ert7Ta53snfB"),
            ).to.throw("Invalid WIF encoding");
        });

        it("throws with unknown netowkr", () => {
            expect(() =>
                Wif.decode("eitjyyTgT6WuBtdSVk1HWT2m6heGhfWaxcuLQMhh5Aw7SmxcMzfd"),
            ).to.throw("Unknown WIF prefix");
        });

        it("5003 (compressed, testnet)", () => {
            const result = Wif.decode("cMahea7zqjxrtgAbB7LSGbcQUr1uX1ojuat9jZodMN8rFTv2sfUK");
            expect(result.prefix).to.equal(0xef);
            expect(result.network).to.equal(Network.testnet);
            expect(result.compressed).to.equal(true);
            expect(result.privateKey.toString("hex")).to.equal("000000000000000000000000000000000000000000000000000000000000138b"); // prettier-ignore
        });

        it("2021^5 (uncompressed, testnet)", () => {
            const result = Wif.decode("91avARGdfge8E4tZfYLoxeJ5sGBdNJQH4kvjpWAxgzczjbCwxic");
            expect(result.prefix).to.equal(0xef);
            expect(result.network).to.equal(Network.testnet);
            expect(result.compressed).to.equal(false);
            expect(result.privateKey.toString("hex")).to.equal("0000000000000000000000000000000000000000000000000077c8350c02b595"); // prettier-ignore
        });

        it("0x54321deadbeef (compressed, mainnet)", () => {
            const result = Wif.decode("KwDiBf89QgGbjEhKnhXJuH7LrciVrZi3qYjgiuQJv1h8Ytr2S53a");
            expect(result.prefix).to.equal(0x80);
            expect(result.network).to.equal(Network.mainnet);
            expect(result.compressed).to.equal(true);
            expect(result.privateKey.toString("hex")).to.equal("00000000000000000000000000000000000000000000000000054321deadbeef"); // prettier-ignore
        });
    });
});
