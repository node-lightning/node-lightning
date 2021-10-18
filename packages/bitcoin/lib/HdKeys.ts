import * as crypto from "@node-lightning/crypto";
import { BufferReader, BufferWriter } from "../../bufio/dist";
import { Base58Check } from "./Base58Check";
import { BitcoinError } from "./BitcoinError";
import { BitcoinErrorCode } from "./BitcoinErrorCode";
import { Network } from "./Network";
import { PrivateKey } from "./PrivateKey";
import { PublicKey } from "./PublicKey";

export enum HdKeyType {
    x = "x",
}

export class HdKeyCodec {
    public static decodeVersion(version: number): [Network, HdKeyType, boolean] {
        for (const network of Network.all) {
            if (version === network.xpubVersion) {
                return [network, HdKeyType.x, false];
            } else if (version === network.xprvVersion) {
                return [network, HdKeyType.x, true];
            }
        }
        throw new BitcoinError(BitcoinErrorCode.UnkownHdKeyVersion, version.toString());
    }

    public static decode(input: string): HdPrivateKey | HdPublicKey {
        const buf = Base58Check.decode(input);

        if (buf.length !== 78) {
            throw new BitcoinError(BitcoinErrorCode.InvalidHdEncoding, input);
        }

        const r = new BufferReader(buf);
        const version: number = r.readUInt32BE();
        const depth = r.readUInt8();
        const parentFingerprint = r.readBytes(4);
        const childNum = r.readUInt32BE();
        const chaincode = r.readBytes(32);
        const rawkey = r.readBytes(33);

        const [network, type, isPrivate] = HdKeyCodec.decodeVersion(version);

        if (depth === 0 && !parentFingerprint.equals(Buffer.alloc(4))) {
            throw new BitcoinError(BitcoinErrorCode.InvalidHdEncoding, input);
        }

        if (depth === 0 && childNum !== 0) {
            throw new BitcoinError(BitcoinErrorCode.InvalidHdEncoding, input);
        }

        let key: HdPrivateKey | HdPublicKey;

        // private key
        if (isPrivate) {
            key = new HdPrivateKey();

            // validate correct prefix
            if (rawkey[0] !== 0x00) {
                throw new BitcoinError(BitcoinErrorCode.InvalidHdEncoding, input);
            }

            // construct and validate private key
            if (key instanceof HdPrivateKey) {
                key.privateKey = new PrivateKey(rawkey.slice(1), network);
            }
        }
        // public key
        else if (!isPrivate) {
            key = new HdPublicKey();

            // construct and validate public key
            if (key instanceof HdPublicKey) {
                key.publicKey = new PublicKey(rawkey, network);
            }
        }
        // unknown key type
        else {
            throw new BitcoinError(BitcoinErrorCode.UnkownHdKeyVersion, input);
        }

        // apply the rest of the values
        key.network = network;
        key.type = type;
        key.depth = depth;
        key.parentFingerprint = parentFingerprint;
        key.number = childNum;
        key.chainCode = chaincode;

        return key;
    }

    public static encode(key: HdPrivateKey | HdPublicKey) {
        const w = new BufferWriter(Buffer.alloc(78));
        w.writeUInt32BE(key.version);
        w.writeUInt8(key.depth);
        w.writeBytes(key.parentFingerprint);
        w.writeUInt32BE(key.number);
        w.writeBytes(key.chainCode);

        if (key instanceof HdPrivateKey) {
            w.writeUInt8(0);
            w.writeBytes(key.privateKey.toBuffer());
        } else {
            w.writeBytes(key.publicKey.toBuffer(true));
        }

        const buf = w.toBuffer();
        return Base58Check.encode(buf);
    }
}

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
}
