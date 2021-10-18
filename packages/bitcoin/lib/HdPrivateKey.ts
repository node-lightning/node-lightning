import * as crypto from "@node-lightning/crypto";
import { BufferWriter } from "../../bufio/dist";
import { BitcoinError } from "./BitcoinError";
import { BitcoinErrorCode } from "./BitcoinErrorCode";
import { HdKeyCodec } from "./HdKeyCodec";
import { HdKeyType } from "./HdKeyType";
import { HdPublicKey } from "./HdPublicKey";
import { Network } from "./Network";
import { PrivateKey } from "./PrivateKey";
import { PublicKey } from "./PublicKey";

export class HdPrivateKey {
    public static fromPath(
        path: string,
        seed: Buffer,
        network: Network,
        type = HdKeyType.x,
    ): HdPrivateKey {
        const parts = path.split("/");
        if (parts[0] !== "m" || parts.length > 255) {
            throw new BitcoinError(BitcoinErrorCode.InvalidHdPath, path);
        }
        let key = HdPrivateKey.fromSeed(seed, network, type);

        for (let i = 1; i < parts.length; i++) {
            const part = parts[i];

            const hardened = part.endsWith("'");
            const num = hardened
                ? 2 ** 31 + Number(part.substring(0, part.length - 1))
                : Number(part);

            if (isNaN(num) || num < 0 || num >= 2 ** 32 || (!hardened && num >= 2 ** 31)) {
                throw new BitcoinError(BitcoinErrorCode.InvalidHdPath, path);
            }

            key = key.derive(num);
        }

        return key;
    }

    public static fromSeed(seed: Buffer, network: Network, type = HdKeyType.x): HdPrivateKey {
        const l = crypto.hmac(Buffer.from("Bitcoin seed"), seed, "sha512");

        const key = new HdPrivateKey();
        key.network = network;
        key.type = type;
        key.depth = 0;
        key.number = 0;
        key.parentFingerprint = Buffer.from([0, 0, 0, 0]);
        key.chainCode = l.slice(32);
        key.privateKey = new PrivateKey(l.slice(0, 32), network);
        return key;
    }

    public static decode(input: string): HdPrivateKey {
        const result = HdKeyCodec.decode(input);
        if (!(result instanceof HdPrivateKey)) {
            throw new BitcoinError(BitcoinErrorCode.InvalidHdPrivateKey, input);
        } else {
            return result;
        }
    }

    public type: HdKeyType;
    public network: Network;
    public depth: number;
    public parentFingerprint: Buffer;
    public number: number;
    public chainCode: Buffer;
    public privateKey: PrivateKey;

    private _publicKey: PublicKey;
    private _fingerprint: Buffer;

    public get version(): number {
        switch (this.type) {
            case HdKeyType.x:
                return this.network.xprvVersion;
        }
    }

    public get isHardened(): boolean {
        return this.number >= 2 ** 31;
    }

    public get publicKey(): PublicKey {
        if (!this._publicKey) {
            this._publicKey = this.privateKey.toPubKey();
        }
        return this._publicKey;
    }

    public get fingerprint(): Buffer {
        if (!this._fingerprint) {
            this._fingerprint = crypto.hash160(this.publicKey.toBuffer(true));
        }
        return this._fingerprint;
    }

    public derive(i: number): HdPrivateKey {
        const result = new HdPrivateKey();
        result.network = this.network;
        result.type = this.type;
        result.depth = this.depth + 1;
        result.number = i;
        result.parentFingerprint = Buffer.from(this.fingerprint.slice(0, 4));

        const data = new BufferWriter(Buffer.alloc(37));

        // hardened
        if (i >= 2 ** 31) {
            data.writeUInt8(0);
            data.writeBytes(this.privateKey.toBuffer());
            data.writeUInt32BE(i);
        }
        // normal child
        else {
            data.writeBytes(this.privateKey.toPubKey().toBuffer(true));
            data.writeUInt32BE(i);
        }

        const l = crypto.hmac(this.chainCode, data.toBuffer(), "sha512");
        const ll = l.slice(0, 32);
        const lr = l.slice(32);

        result.privateKey = this.privateKey.tweakAdd(ll);
        result.chainCode = lr;

        return result;
    }

    public toPubKey(): HdPublicKey {
        const result = new HdPublicKey();
        result.network = this.network;
        result.type = this.type;
        result.depth = this.depth;
        result.number = this.number;
        result.parentFingerprint = Buffer.from(this.parentFingerprint);
        result.chainCode = Buffer.from(this.chainCode);
        result.publicKey = this.publicKey;
        return result;
    }

    public encode(): string {
        return HdKeyCodec.encode(this);
    }
}
