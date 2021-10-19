import * as crypto from "@node-lightning/crypto";
import { BitcoinError, BitcoinErrorCode } from ".";
import { BufferWriter } from "../../bufio/dist";
import { Address } from "./Address";
import { HdKeyCodec } from "./HdKeyCodec";
import { HdKeyType } from "./HdKeyType";
import { Network } from "./Network";
import { PublicKey } from "./PublicKey";

export class HdPublicKey {
    public static decode(input: string): HdPublicKey {
        const result = HdKeyCodec.decode(input);
        if (!(result instanceof HdPublicKey)) {
            throw new BitcoinError(BitcoinErrorCode.InvalidHdPublicKey, input);
        }
        return result;
    }

    public network: Network;
    public type: HdKeyType;
    public depth: number;
    public parentFingerprint: Buffer;
    public number: number;
    public chainCode: Buffer;
    public publicKey: PublicKey;

    private _fingerprint: Buffer;

    public get version(): number {
        switch (this.type) {
            case HdKeyType.x:
                return this.network.xpubVersion;
        }
    }

    public get isHardened(): boolean {
        return this.number >= 2 ** 31;
    }

    public get fingerprint(): Buffer {
        if (!this._fingerprint) {
            this._fingerprint = crypto.hash160(this.publicKey.toBuffer(true));
        }
        return this._fingerprint;
    }

    public derivePublic(i: number): HdPublicKey {
        // From here on we're working with a public key, so we cannot
        // derive hardened public keys.
        if (i >= 2 ** 31) {
            throw new BitcoinError(BitcoinErrorCode.InvalidHdDerivation);
        }

        const data = new BufferWriter(Buffer.alloc(37));
        data.writeBytes(this.publicKey.toBuffer(true));
        data.writeUInt32BE(i);

        const l = crypto.hmac(this.chainCode, data.toBuffer());
        const ll = l.slice(0, 32);
        const lr = l.slice(32);

        const childPubKey = this.publicKey.tweakAdd(ll);
        const childChainCode = lr;

        const child = new HdPublicKey();
        child.network = this.network;
        child.type = this.type;
        child.depth = this.depth + 1;
        child.number = this.number;
        child.publicKey = childPubKey;
        child.chainCode = childChainCode;

        return child;
    }

    public encode(): string {
        return HdKeyCodec.encode(this);
    }

    public toAddress(): string {
        return Address.encodeLegacy(this.network.p2pkhPrefix, this.publicKey.hash160(true));
    }
}
