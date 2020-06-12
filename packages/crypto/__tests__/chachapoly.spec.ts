import { expect } from "chai";
import * as ccp from "../lib/chachapoly";

describe("chacha20-poly1305", () => {
    describe("BOLT #8 vectors", () => {
        describe("encrypt", () => {
            it("noise initiator act1", () => {
                const k = Buffer.from("e68f69b7f096d7917245f5e5cf8ae1595febe4d4644333c99f9c4a1282031c9f", "hex"); // prettier-ignore
                const n = Buffer.from("000000000000000000000000", "hex");
                const ad = Buffer.from("9e0e7de8bb75554f21db034633de04be41a2b8a18da7a319a03c803bf02b396c", "hex"); // prettier-ignore
                const pt = Buffer.alloc(0);
                const actual = ccp.ccpEncrypt(k, n, ad, pt);
                expect(actual.toString("hex")).to.equal("0df6086551151f58b8afe6c195782c6a");
            });

            it("noise initiator act3", () => {
                const k = Buffer.from("908b166535c01a935cf1e130a5fe895ab4e6f3ef8855d87e9b7581c4ab663ddc", "hex"); // prettier-ignore
                const n = Buffer.from("000000000100000000000000", "hex");
                const ad = Buffer.from("90578e247e98674e661013da3c5c1ca6a8c8f48c90b485c0dfa1494e23d56d72", "hex"); // prettier-ignore
                const pt = Buffer.from("034f355bdcb7cc0af728ef3cceb9615d90684bb5b2ca5f859ab0f0b704075871aa", "hex"); // prettier-ignore
                const actual = ccp.ccpEncrypt(k, n, ad, pt);
                expect(actual.toString("hex")).to.equal(
                    "b9e3a702e93e3a9948c2ed6e5fd7590a6e1c3a0344cfc9d5b57357049aa22355361aa02e55a8fc28fef5bd6d71ad0c3822",
                );
            });

            it("noise responder act 2", () => {
                const k = Buffer.from("908b166535c01a935cf1e130a5fe895ab4e6f3ef8855d87e9b7581c4ab663ddc", "hex"); // prettier-ignore
                const n = Buffer.from("000000000000000000000000", "hex");
                const ad = Buffer.from("38122f669819f906000621a14071802f93f2ef97df100097bcac3ae76c6dc0bf", "hex"); // prettier-ignore
                const pt = Buffer.from("", "hex"); // prettier-ignore
                const actual = ccp.ccpEncrypt(k, n, ad, pt);
                expect(actual.toString("hex")).to.equal("6e2470b93aac583c9ef6eafca3f730ae");
            });
        });

        describe("decrypt", () => {
            it("noise initiator act2", () => {
                const k = Buffer.from("908b166535c01a935cf1e130a5fe895ab4e6f3ef8855d87e9b7581c4ab663ddc", "hex"); // prettier-ignore
                const n = Buffer.from("000000000000000000000000", "hex");
                const ad = Buffer.from("38122f669819f906000621a14071802f93f2ef97df100097bcac3ae76c6dc0bf", "hex"); // prettier-ignore
                const ciphertext = Buffer.from("6e2470b93aac583c9ef6eafca3f730ae", "hex");
                const actual = ccp.ccpDecrypt(k, n, ad, ciphertext);
                expect(actual.toString("hex")).to.equal("");
            });

            it("noise responder act1", () => {
                const k = Buffer.from("e68f69b7f096d7917245f5e5cf8ae1595febe4d4644333c99f9c4a1282031c9f", "hex"); // prettier-ignore
                const n = Buffer.from("000000000000000000000000", "hex");
                const ad = Buffer.from("9e0e7de8bb75554f21db034633de04be41a2b8a18da7a319a03c803bf02b396c", "hex"); // prettier-ignore
                const ciphertext = Buffer.from("0df6086551151f58b8afe6c195782c6a", "hex");
                const actual = ccp.ccpDecrypt(k, n, ad, ciphertext);
                expect(actual.toString("hex")).to.equal("");
            });

            it("noise responder act3", () => {
                const k = Buffer.from("908b166535c01a935cf1e130a5fe895ab4e6f3ef8855d87e9b7581c4ab663ddc", "hex"); // prettier-ignore
                const n = Buffer.from("000000000100000000000000", "hex");
                const ad = Buffer.from("90578e247e98674e661013da3c5c1ca6a8c8f48c90b485c0dfa1494e23d56d72", "hex"); // prettier-ignore
                const ciphertext = Buffer.from("b9e3a702e93e3a9948c2ed6e5fd7590a6e1c3a0344cfc9d5b57357049aa22355361aa02e55a8fc28fef5bd6d71ad0c3822", "hex"); // prettier-ignore
                const actual = ccp.ccpDecrypt(k, n, ad, ciphertext);
                expect(actual.toString("hex")).to.equal(
                    "034f355bdcb7cc0af728ef3cceb9615d90684bb5b2ca5f859ab0f0b704075871aa",
                );
            });
        });
    });
});
