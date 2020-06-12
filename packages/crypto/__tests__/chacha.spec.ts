import { expect } from "chai";
import { chachaDecrypt, chachaEncrypt } from "../lib/chacha";

describe("chachaEncrypt", () => {
    it("encrypts", () => {
        const key = Buffer.alloc(32);
        const iv = Buffer.alloc(16);
        const data = Buffer.alloc(64);
        const result = chachaEncrypt(key, iv, data);
        expect(result.toString("hex")).to.equal(
            "76b8e0ada0f13d90405d6ae55386bd28bdd219b8a08ded1aa836efcc8b770dc7da41597c5157488d7724e03fb8d84a376a43b8f41518a11cc387b669b2ee6586",
        );
    });
});

describe("chachaDecrypt", () => {
    it("decrypts", () => {
        const key = Buffer.alloc(32);
        const iv = Buffer.alloc(16);
        const cipher = Buffer.from(
            "76b8e0ada0f13d90405d6ae55386bd28bdd219b8a08ded1aa836efcc8b770dc7da41597c5157488d7724e03fb8d84a376a43b8f41518a11cc387b669b2ee6586",
            "hex",
        );
        const result = chachaDecrypt(key, iv, cipher);
        expect(result.toString("hex")).to.equal(
            "00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
        );
    });
});
