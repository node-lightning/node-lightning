import * as crypto from "@node-lightning/crypto";
import { BufferReader, BufferWriter } from "../../bufio/dist";
import { Base58Check } from "./Base58Check";

export enum ExtKeyType {
    MainnetPublic = 0x0488b21e,
    MainnetPrivate = 0x0488ade4,
    TestnetPublic = 0x043587cf,
    TestnetPrivate = 0x04358394,
}

export enum ExtKeyErrorCode {
    PrivateKeyHidden,
    InvalidEncoding,
    IncorrectKeyVersion,
    InvalidPath,
    InvalidDerivation,
    InvalidPrivateKey,
    InvalidPublicKey,
}

export class ExtKeyError extends Error {
    public code: ExtKeyErrorCode;
    public data: string;

    constructor(code: ExtKeyErrorCode, data?: string) {
        let msg;
        switch (code) {
            case ExtKeyErrorCode.PrivateKeyHidden:
                msg = "Private key is not accessible from public key";
                break;
            case ExtKeyErrorCode.InvalidEncoding:
                msg = "Invalid encoding [data=" + data + "]";
                break;
            case ExtKeyErrorCode.IncorrectKeyVersion:
                msg = "Incorrect key version [data=" + data + "]";
                break;
            case ExtKeyErrorCode.InvalidPath:
                msg = "Invalid path [path=" + data + "]";
                break;
            case ExtKeyErrorCode.InvalidDerivation:
                msg = "Attempting to dervice a hardened public key from a parent public key";
                break;
            case ExtKeyErrorCode.InvalidPrivateKey:
                msg = "Invalid private key [key=" + data + "]";
                break;
            case ExtKeyErrorCode.InvalidPublicKey:
                msg = "Invalid public key [key=" + data + "]";
                break;
            default:
                msg = "Unknown error";
        }

        super(msg);
        this.code = code;
        this.data = data;
    }
}

export class HdKey {
    public static fromPath(path: string, seed: Buffer, version: ExtKeyType): HdKey {
        const parts = path.split("/");
        if (parts[0] !== "m" || parts.length > 255) {
            throw new ExtKeyError(ExtKeyErrorCode.InvalidPath, path);
        }
        let key = HdKey.fromSeed(seed, version);

        for (let i = 1; i < parts.length; i++) {
            const part = parts[i];

            const hardened = part.endsWith("'");
            const num = hardened
                ? 2 ** 31 + Number(part.substring(0, part.length - 1))
                : Number(part);

            if (isNaN(num) || num < 0 || num >= 2 ** 32 || (!hardened && num >= 2 ** 31)) {
                throw new ExtKeyError(ExtKeyErrorCode.InvalidPath, path);
            }

            key = key.derivePrivate(num);
        }

        return key;
    }

    public static fromSeed(seed: Buffer, version: ExtKeyType): HdKey {
        const l = crypto.hmac(Buffer.from("Bitcoin seed"), seed, "sha512");

        const key = new HdKey();
        key.version = version;
        key.depth = 0;
        key.number = 0;
        key.parentFingerprint = Buffer.from([0, 0, 0, 0]);
        key.chainCode = l.slice(32);
        key._privateKey = l.slice(0, 32);
        return key;
    }

    public static decode(input: string): HdKey {
        const buf = Base58Check.decode(input);

        if (buf.length !== 78) {
            throw new ExtKeyError(ExtKeyErrorCode.InvalidEncoding, input);
        }

        const r = new BufferReader(buf);
        const version: ExtKeyType = r.readUInt32BE();
        const depth = r.readUInt8();
        const parentFingerprint = r.readBytes(4);
        const childNum = r.readUInt32BE();
        const chaincode = r.readBytes(32);
        const rawkey = r.readBytes(33);

        if (depth === 0 && !parentFingerprint.equals(Buffer.alloc(4))) {
            throw new ExtKeyError(ExtKeyErrorCode.InvalidEncoding, input);
        }

        if (depth === 0 && childNum !== 0) {
            throw new ExtKeyError(ExtKeyErrorCode.InvalidEncoding, input);
        }

        const key = new HdKey();
        key.version = version;
        key.depth = depth;
        key.parentFingerprint = parentFingerprint;
        key.number = childNum;
        key.chainCode = chaincode;

        // private key
        if (version === ExtKeyType.MainnetPrivate || version === ExtKeyType.TestnetPrivate) {
            // validate correct prefix
            if (rawkey[0] !== 0x00) {
                throw new ExtKeyError(ExtKeyErrorCode.InvalidEncoding, input);
            }

            key._privateKey = rawkey.slice(1);

            // vaildate private key is valid
            if (!crypto.validPrivateKey(key.privateKey)) {
                throw new ExtKeyError(
                    ExtKeyErrorCode.InvalidPrivateKey,
                    key.privateKey.toString("hex"),
                );
            }
        }
        // public key
        else if (version === ExtKeyType.MainnetPublic || version === ExtKeyType.TestnetPublic) {
            key._publicKey = rawkey;

            // validate public key is ok
            if (!crypto.validPublicKey(key.publicKey)) {
                throw new ExtKeyError(
                    ExtKeyErrorCode.InvalidPublicKey,
                    key.publicKey.toString("hex"),
                );
            }
        }
        // unknown key type
        else {
            throw new ExtKeyError(ExtKeyErrorCode.IncorrectKeyVersion, input);
        }

        return key;
    }

    public version: ExtKeyType;
    public depth: number;
    public parentFingerprint: Buffer;
    public number: number;
    public chainCode: Buffer;

    private _privateKey: Buffer;
    private _publicKey: Buffer;
    private _fingerprint: Buffer;

    public get isPrivate(): boolean {
        return Buffer.isBuffer(this._privateKey);
    }

    public get isHardened(): boolean {
        return this.number >= 2 ** 31;
    }

    public get privateKey(): Buffer {
        return this._privateKey;
    }

    public get publicKey(): Buffer {
        if (!this._publicKey && this.isPrivate) {
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

    public derivePrivate(i: number): HdKey {
        const result = new HdKey();
        result.version = this.version;
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

        result._privateKey = crypto.privateKeyTweakAdd(ll, this.privateKey);
        result.chainCode = lr;

        return result;
    }

    public derivePublic(i: number): HdKey {
        // when private key, we can derive anything including hardened
        // public keys.  In order to do this we first derive the private
        // key then convert it to a public key
        if (this.isPrivate) {
            return this.derivePrivate(i).toPubKey();
        }

        // From here on we're working with a public key, so we cannot
        // derive hardened public keys.
        if (i >= 2 ** 31) {
            throw new ExtKeyError(ExtKeyErrorCode.InvalidDerivation);
        }

        const data = new BufferWriter(Buffer.alloc(37));
        data.writeBytes(this.publicKey);
        data.writeUInt32BE(i);

        const l = crypto.hmac(this.chainCode, data.toBuffer());
        const ll = l.slice(0, 32);
        const lr = l.slice(32);

        const childPubKey = crypto.publicKeyTweakAdd(this.publicKey, ll, true);
        const childChainCode = lr;

        const child = new HdKey();
        child.version = this.version;
        child.depth = this.depth + 1;
        child.number = this.number;
        child._publicKey = childPubKey;
        child.chainCode = childChainCode;

        return child;
    }

    public toPubKey(): HdKey {
        const result = new HdKey();
        result.version =
            this.version === ExtKeyType.MainnetPrivate || this.version === ExtKeyType.MainnetPublic
                ? ExtKeyType.MainnetPublic
                : ExtKeyType.TestnetPublic;
        result.depth = this.depth;
        result.number = this.number;
        result.parentFingerprint = Buffer.from(this.parentFingerprint);
        result.chainCode = Buffer.from(this.chainCode);
        result._publicKey = this.publicKey;
        return result;
    }

    public encode(): string {
        const w = new BufferWriter(Buffer.alloc(78));
        w.writeUInt32BE(this.version);
        w.writeUInt8(this.depth);
        w.writeBytes(this.parentFingerprint);
        w.writeUInt32BE(this.number);
        w.writeBytes(this.chainCode);

        if (this.isPrivate) {
            w.writeUInt8(0);
            w.writeBytes(this.privateKey);
        } else {
            w.writeBytes(this.publicKey);
        }
        const buf = w.toBuffer();
        return Base58Check.encode(buf);
    }
}
