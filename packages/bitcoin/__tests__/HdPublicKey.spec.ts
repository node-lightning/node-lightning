import { expect } from "chai";
import { HdPrivateKey } from "../lib/HdPrivateKey";
import { Network } from "../lib/Network";

describe("HdPublicKey", () => {
    it("pub key can derive pub key", () => {
        const seed = Buffer.alloc(32, 0x01);
        const master = HdPrivateKey.fromSeed(seed, Network.mainnet);
        const pubkey = master.toPubKey();
        const key = pubkey.derivePublic(0).derivePublic(1);
        expect(key.depth).to.equal(2);
    });
});
