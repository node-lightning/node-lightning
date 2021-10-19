import { expect } from "chai";
import { HdKeyType } from "../lib";
import { HdPrivateKey } from "../lib/HdPrivateKey";
import { Network } from "../lib/Network";

describe("HdPublicKey", () => {
    describe(".derive()", () => {
        it("pub key can derive pub key", () => {
            const seed = Buffer.alloc(32, 0x01);
            const master = HdPrivateKey.fromSeed(seed, Network.mainnet);
            const pubkey = master.toPubKey();
            const key = pubkey.derivePublic(0).derivePublic(1);
            expect(key.depth).to.equal(2);
        });
    });

    describe(".toAddress()", () => {
        it("xpub", () => {
            const seed = Buffer.alloc(32, 0x01);
            const prvkey = HdPrivateKey.fromPath("m/0", seed, Network.mainnet, HdKeyType.x);
            expect(prvkey.toPubKey().toAddress()).to.equal("1J5RZmj33xPt9TRnHFEKDoZgxqT2e2us12");
        });
    });
});
