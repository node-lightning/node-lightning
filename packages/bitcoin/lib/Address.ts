import { hash160 } from "@node-lightning/crypto";
import { BufferWriter } from "../../bufio/dist";
import { Base58Check } from "./Base58Check";
import { Network } from "./Network";
import { Script } from "./Script";

export class Address {
    public network: Network;

    constructor(network: Network) {
        this.network = network;
    }

    public createP2PKH(pubkey: Buffer): string {
        const hash = hash160(pubkey);
        const w = new BufferWriter(Buffer.alloc(21));
        w.writeUInt8(this.network.p2pkhPrefix);
        w.writeBytes(hash);
        return Base58Check.encode(w.toBuffer());
    }

    public createP2SH(script: Script): string {
        const hash = hash160(script.serializeCmds());
        const w = new BufferWriter(Buffer.alloc(21));
        w.writeUInt8(this.network.p2shPrefix);
        w.writeBytes(hash);
        return Base58Check.encode(w.toBuffer());
    }
}
