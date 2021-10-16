import { expect } from "chai";
import * as crypto from "@node-lightning/crypto";
import { Address } from "../lib/Address";
import { Network } from "../lib/Network";
import { Script } from "../lib/Script";
import { OpCode } from "../lib";

describe("Address", () => {
    let sut: Address;

    beforeEach(() => {
        sut = new Address(Network.mainnet);
    });

    it("P2PKH uncompressed", () => {
        const prvKey = Buffer.from("0000000000000000000000000000000000000000000000000000000000000001", "hex"); // prettier-ignore
        const pubKey = crypto.getPublicKey(prvKey, false);
        const address = sut.createP2PKH(pubKey);
        expect(address).to.equal("1EHNa6Q4Jz2uvNExL497mE43ikXhwF6kZm");
    });

    it("P2PKH compressed", () => {
        const prvKey = Buffer.from("0000000000000000000000000000000000000000000000000000000000000001", "hex"); // prettier-ignore
        const pubKey = crypto.getPublicKey(prvKey, true);
        const address = sut.createP2PKH(pubKey);
        expect(address).to.equal("1BgGZ9tcN4rm9KBzDn7KprQz87SZ26SAMH");
    });

    it("P2SH", () => {
        const script = new Script(OpCode.OP_1);
        const address = sut.createP2SH(script);
        expect(address).to.to.equal("3MaB7QVq3k4pQx3BhsvEADgzQonLSBwMdj");
    });
});
