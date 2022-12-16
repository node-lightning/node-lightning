import { hash256, sign } from "@node-lightning/crypto";
import { expect } from "chai";
import { Network, PrivateKey } from "../lib";
import { EcdsaSig } from "../lib/EcdsaSig";

describe(EcdsaSig.name, () => {
    describe(EcdsaSig.prototype.isValid.name, () => {
        it("returns true when valid", () => {
            const privkey = new PrivateKey(Buffer.alloc(32, 0x01), Network.testnet);
            const pubkey = privkey.toPubKey(true);
            const msg = hash256(Buffer.from("Bitcoin"));
            const sig = sign(msg, privkey.toBuffer());
            const sut = new EcdsaSig(sig);
            expect(sut.isValid(msg, pubkey)).to.equal(true);
        });

        it("returns false when invalid", () => {
            const privkey = new PrivateKey(Buffer.alloc(32, 0x01), Network.testnet);

            const privkey2 = new PrivateKey(Buffer.alloc(32, 0x02), Network.testnet);
            const pubkey2 = privkey2.toPubKey(true);

            const msg = hash256(Buffer.from("Bitcoin"));
            const sig = sign(msg, privkey.toBuffer());
            const sut = new EcdsaSig(sig);

            expect(sut.isValid(msg, pubkey2)).to.equal(false);
        });
    });
});
