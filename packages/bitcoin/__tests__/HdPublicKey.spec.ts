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
            const key = pubkey.derive(0).derive(1);
            expect(key.depth).to.equal(2);
        });
    });

    describe(".toAddress()", () => {
        const seed = Buffer.alloc(32, 0x01);

        it("xpub", () => {
            const prvkey = HdPrivateKey.fromPath("m/0", seed, Network.mainnet, HdKeyType.x);
            expect(prvkey.toAddress()).to.equal("1J5RZmj33xPt9TRnHFEKDoZgxqT2e2us12");
        });

        it("ypub", () => {
            const prvkey = HdPrivateKey.fromPath("m/0", seed, Network.mainnet, HdKeyType.y);
            expect(prvkey.toAddress()).to.equal("3PmmbYZxjBnsyLaC3oehbHpZqciLbxiEog");
        });

        it("zpub", () => {
            const prvkey = HdPrivateKey.fromPath("m/0", seed, Network.mainnet, HdKeyType.z);
            expect(prvkey.toAddress()).to.equal("bc1qhdgyak30llluz36r6lk5ywup5uq0jz0ecsecfv");
        });
    });
});
