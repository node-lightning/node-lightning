import { expect } from "chai";
import { HdPrivateKey } from "../lib/HdPrivateKey";
import { Network } from "../lib/Network";

describe("HdPrivateKey", () => {
    it("pub key can derive pub key", () => {
        const seed = Buffer.alloc(32, 0x01);
        const master = HdPrivateKey.fromSeed(seed, Network.mainnet);
        const key = master.derive(0).derive(1);
        expect(key.depth).to.equal(2);
    });
});
