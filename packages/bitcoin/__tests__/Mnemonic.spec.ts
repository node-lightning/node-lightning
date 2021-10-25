import { expect } from "chai";
import { HdPrivateKey, Network } from "../lib";
import { Mnemonic } from "../lib/Mnemonic";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const vectors = require("../__fixtures__/mnemonic.json");

describe("Mnemonic", () => {
    describe("BIP39 Vectors", () => {
        describe("English", () => {
            describe(".seedFromPhrase()", () => {
                for (const [, phrase, seedHex, xprv] of vectors.english) {
                    it(`${phrase.substring(0, 32).padEnd(32, " ")}... => ${seedHex.substring(
                        0,
                        32,
                    )}...`, async () => {
                        const seed = await Mnemonic.seedFromPhrase(phrase, "TREZOR");
                        const masterkey = HdPrivateKey.fromSeed(seed, Network.mainnet);
                        expect(seed.toString("hex")).to.equal(seedHex);
                        expect(masterkey.encode()).to.equal(xprv);
                    });
                }
            });

            describe(".entropyToPhrase", () => {
                for (const [entropy, phrase] of vectors.english) {
                    it(`${entropy.substring(0, 32).padEnd(32, " ")}... => ${phrase
                        .substring(0, 32)
                        .padEnd(32, " ")}...`, () => {
                        const result = Mnemonic.entropyToPhrase(Buffer.from(entropy, "hex"));
                        expect(result).to.equal(phrase);
                    });
                }
            });
        });
    });

    describe(".entropyToPhrase()", () => {
        describe("wordlist", () => {
            it("throws on invalid wordlist", () => {
                expect(() =>
                    Mnemonic.entropyToPhrase(Buffer.alloc(32), ["hello", "world"]),
                ).to.throw("Invalid mnemonic word list");
            });
        });

        describe("entropy", () => {
            for (let i = 0; i < 40; i++) {
                const bits = i * 8;
                const valid = bits >= 128 && bits <= 256 && bits % 32 === 0;
                it(`${bits} bits ${valid ? "is ok" : "throws"}`, () => {
                    const entropy = Buffer.alloc(i);
                    if (valid) expect(() => Mnemonic.entropyToPhrase(entropy)).to.not.throw();
                    else
                        expect(() => Mnemonic.entropyToPhrase(entropy)).to.throw(
                            "Invalid mnemonic entropy",
                        );
                });
            }
        });
    });
});
