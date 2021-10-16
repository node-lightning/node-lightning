import * as crypto from "@node-lightning/crypto";
import { BufferReader, BufferWriter } from "../../bufio/dist";
import { Base58Check } from "./Base58Check";
import { Network } from "./Network";

export enum HdKeyType {
    x = "x",
}

export enum HdKeyErrorCode {
    PrivateKeyHidden,
    InvalidEncoding,
    IncorrectKeyVersion,
    InvalidPath,
    InvalidDerivation,
    InvalidPrivateKey,
    InvalidPublicKey,
    ExpectedPublicKey,
    ExpectedPrivateKey,
    UnkownVersion,
}

export class HdKeyError extends Error {
    public code: HdKeyErrorCode;
    public data: string;

    constructor(code: HdKeyErrorCode, data?: string) {
        let msg;
        switch (code) {
            case HdKeyErrorCode.UnkownVersion:
                msg = "Unkown version [data=" + data + "]";
                break;
            case HdKeyErrorCode.PrivateKeyHidden:
                msg = "Private key is not accessible from public key";
                break;
            case HdKeyErrorCode.InvalidEncoding:
                msg = "Invalid encoding [data=" + data + "]";
                break;
            case HdKeyErrorCode.InvalidPath:
                msg = "Invalid path [path=" + data + "]";
                break;
            case HdKeyErrorCode.InvalidDerivation:
                msg = "Attempting to dervice a hardened public key from a parent public key";
                break;
            case HdKeyErrorCode.InvalidPrivateKey:
                msg = "Invalid private key [key=" + data + "]";
                break;
            case HdKeyErrorCode.InvalidPublicKey:
                msg = "Invalid public key [key=" + data + "]";
                break;
            case HdKeyErrorCode.ExpectedPrivateKey:
                msg = "Expected private key [data=" + data + "]";
                break;
            case HdKeyErrorCode.ExpectedPublicKey:
                msg = "Expected public key [data=" + data + "]";
                break;
            default:
                msg = "Unknown error";
        }

        super(msg);
        this.code = code;
        this.data = data;
    }
}

export class HdKeyCodec {
    public static decodeVersion(version: number): [Network, HdKeyType, boolean] {
        for (const network of Network.all) {
            if (version === network.xpubPrefix) {
                return [network, HdKeyType.x, false];
            } else if (version === network.xprvPrefix) {
                return [network, HdKeyType.x, true];
            }
        }
        throw new HdKeyError(HdKeyErrorCode.UnkownVersion, version.toString());
    }

    public static decode(input: string): HdPrivateKey | HdPublicKey {
        const buf = Base58Check.decode(input);

        if (buf.length !== 78) {
            throw new HdKeyError(HdKeyErrorCode.InvalidEncoding, input);
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
            throw new HdKeyError(HdKeyErrorCode.InvalidEncoding, input);
        }

        if (depth === 0 && childNum !== 0) {
            throw new HdKeyError(HdKeyErrorCode.InvalidEncoding, input);
        }

        let key: HdPrivateKey | HdPublicKey;

        // private key
        if (isPrivate) {
            key = new HdPrivateKey();

            // validate correct prefix
            if (rawkey[0] !== 0x00) {
                throw new HdKeyError(HdKeyErrorCode.InvalidEncoding, input);
            }

            if (key instanceof HdPrivateKey) {
                key.privateKey = rawkey.slice(1);

                // vaildate private key is valid
                if (!crypto.validPrivateKey(key.privateKey)) {
                    throw new HdKeyError(
                        HdKeyErrorCode.InvalidPrivateKey,
                        key.privateKey.toString("hex"),
                    );
                }
            }
        }
        // public key
        else if (!isPrivate) {
            key = new HdPublicKey();
            if (key instanceof HdPublicKey) {
                key.publicKey = rawkey;

                // validate public key is ok
                if (!crypto.validPublicKey(key.publicKey)) {
                    throw new HdKeyError(
                        HdKeyErrorCode.InvalidPublicKey,
                        key.publicKey.toString("hex"),
                    );
                }
            }
        }
        // unknown key type
        else {
            throw new HdKeyError(HdKeyErrorCode.UnkownVersion, input);
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
            w.writeBytes(key.privateKey);
        } else {
            w.writeBytes(key.publicKey);
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
            throw new HdKeyError(HdKeyErrorCode.InvalidPath, path);
        }
        let key = HdPrivateKey.fromSeed(seed, network, type);

        for (let i = 1; i < parts.length; i++) {
            const part = parts[i];

            const hardened = part.endsWith("'");
            const num = hardened
                ? 2 ** 31 + Number(part.substring(0, part.length - 1))
                : Number(part);

            if (isNaN(num) || num < 0 || num >= 2 ** 32 || (!hardened && num >= 2 ** 31)) {
                throw new HdKeyError(HdKeyErrorCode.InvalidPath, path);
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
        key.privateKey = l.slice(0, 32);
        return key;
    }

    public static decode(input: string): HdPrivateKey {
        const result = HdKeyCodec.decode(input);
        if (!(result instanceof HdPrivateKey)) {
            throw new HdKeyError(HdKeyErrorCode.ExpectedPrivateKey, input);
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
    public privateKey: Buffer;

    private _publicKey: Buffer;
    private _fingerprint: Buffer;

    public get version(): number {
        switch (this.type) {
            case HdKeyType.x:
                return this.network.xprvPrefix;
        }
    }

    public get isHardened(): boolean {
        return this.number >= 2 ** 31;
    }

    public get publicKey(): Buffer {
        if (!this._publicKey) {
            this._publicKey = crypto.getPublicKey(this.privateKey, true);
        }
        return this._publicKey;
    }

    public get fingerprint(): Buffer {
        if (!this._fingerprint) {
            this._fingerprint = crypto.hash160(this.publicKey);
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
            data.writeBytes(this.privateKey);
            data.writeUInt32BE(i);
        }
        // normal child
        else {
            data.writeBytes(crypto.getPublicKey(this.privateKey, true));
            data.writeUInt32BE(i);
        }

        const l = crypto.hmac(this.chainCode, data.toBuffer(), "sha512");
        const ll = l.slice(0, 32);
        const lr = l.slice(32);

        result.privateKey = crypto.privateKeyTweakAdd(ll, this.privateKey);
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
            throw new HdKeyError(HdKeyErrorCode.ExpectedPublicKey, input);
        }
        return result;
    }

    public network: Network;
    public type: HdKeyType;
    public depth: number;
    public parentFingerprint: Buffer;
    public number: number;
    public chainCode: Buffer;
    public publicKey: Buffer;

    private _fingerprint: Buffer;

    public get version(): number {
        switch (this.type) {
            case HdKeyType.x:
                return this.network.xpubPrefix;
        }
    }

    public get isHardened(): boolean {
        return this.number >= 2 ** 31;
    }

    public get fingerprint(): Buffer {
        if (!this._fingerprint) {
            this._fingerprint = crypto.hash160(this.publicKey);
        }
        return this._fingerprint;
    }

    public derivePublic(i: number): HdPublicKey {
        // From here on we're working with a public key, so we cannot
        // derive hardened public keys.
        if (i >= 2 ** 31) {
            throw new HdKeyError(HdKeyErrorCode.InvalidDerivation);
        }

        const data = new BufferWriter(Buffer.alloc(37));
        data.writeBytes(this.publicKey);
        data.writeUInt32BE(i);

        const l = crypto.hmac(this.chainCode, data.toBuffer());
        const ll = l.slice(0, 32);
        const lr = l.slice(32);

        const childPubKey = crypto.publicKeyTweakAdd(this.publicKey, ll, true);
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
