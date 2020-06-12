import { expect } from "chai";
import { generateKey } from "../lib/generateKey";
import { KeyType } from "../lib/KeyType";

describe("generateKey", () => {
    const ss = Buffer.from(
        "53eb63ea8a3fec3b3cd433b85cd62a4b145e1dda09391b348c4e1cd36a03ea66",
        "hex",
    );

    it("rho", () => {
        const key = generateKey(KeyType.rho, ss);
        expect(key.toString("hex")).to.equal(
            "ce496ec94def95aadd4bec15cdb41a740c9f2b62347c4917325fcc6fb0453986",
        );
    });

    it("mu", () => {
        const key = generateKey(KeyType.mu, ss);
        expect(key.toString("hex")).to.equal(
            "b57061dc6d0a2b9f261ac410c8b26d64ac5506cbba30267a649c28c179400eba",
        );
    });

    it("um", () => {
        const key = generateKey(KeyType.um, ss);
        expect(key.toString("hex")).to.equal(
            "3ca76e96fad1a0300928639d203b4369e81254032156c936179077b08091ca49",
        );
    });

    it("pad", () => {
        const key = generateKey(KeyType.pad, ss);
        expect(key.toString("hex")).to.equal(
            "3c348715f933c32b5571e2c9136b17c4da2e8fd13e35b7092deff56650eea958",
        );
    });
});
