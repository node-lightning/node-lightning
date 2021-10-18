import { expect } from "chai";
import { BitcoinError, BitcoinErrorCode } from "../lib";

describe("BitcoinError", () => {
    it("includes properties", () => {
        const err = new BitcoinError(BitcoinErrorCode.InvalidPrivateKey, { key: Buffer.alloc(32) });
        expect(err.code).to.equal(BitcoinErrorCode.InvalidPrivateKey);
        expect(err.name).to.equal("BitcoinError");
        expect(err.message).to.equal("Invalid private key");
        expect(err.info).to.deep.equal({ key: Buffer.alloc(32) });
    });
});
