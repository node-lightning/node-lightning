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
    InvalidEncoding,
    IncorrectKeyVersion,
    InvalidPath,
}

export class ExtKeyError extends Error {
    public code: ExtKeyErrorCode;
    public data: string;

    constructor(code: ExtKeyErrorCode, data?: string) {
        let msg;
        switch (code) {
            case ExtKeyErrorCode.InvalidEncoding:
                msg = "Invalid encoding [data=" + data + "]";
                break;
            case ExtKeyErrorCode.IncorrectKeyVersion:
                msg = "Incorrect key version [data=" + data + "]";
                break;
            case ExtKeyErrorCode.InvalidPath:
                msg = "Invalid path [path=" + data + "]";
                break;
            default:
                msg = "Unknown error";
        }

        super(msg);
        this.code = code;
        this.data = data;
    }
}

export class ExtPrivateKey {
    public static fromPath(path: string, seed: Buffer, version: ExtKeyType): ExtPrivateKey {
        const parts = path.split("/");
        if (parts[0] !== "m" || parts.length > 255) {
            throw new ExtKeyError(ExtKeyErrorCode.InvalidPath, path);
        }
        let key = ExtPrivateKey.deriveMaster(seed, version);

        for (let i = 1; i < parts.length; i++) {
            const part = parts[i];

            const hardened = part.endsWith("h") || part.endsWith("H");
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

    public static decode(input: string): ExtPrivateKey {
        const buf = Base58Check.decode(input);

        if (buf.length !== 78) {
            throw new ExtKeyError(ExtKeyErrorCode.InvalidEncoding, input);
        }

        const r = new BufferReader(buf);
        const version: ExtKeyType = r.readUInt32BE();
        const depth = r.readUInt8();
        const fingerprint = r.readBytes(4);
        const childNum = r.readUInt32BE();
        const chaincode = r.readBytes(32);
        const rawkey = r.readBytes(33);

        const key = new ExtPrivateKey();
        key.version = version;
        key.depth = depth;
        key.parentFingerprint = fingerprint;
        key.number = childNum;
        key.chainCode = chaincode;

        if (version === ExtKeyType.MainnetPrivate || version === ExtKeyType.TestnetPrivate) {
            key.privateKey = rawkey.slice(1);
        } else {
            throw new ExtKeyError(ExtKeyErrorCode.IncorrectKeyVersion, input);
        }

        return key;
    }

    public static deriveMaster(seed: Buffer, version: ExtKeyType): ExtPrivateKey {
        const l = crypto.hmac(Buffer.from("Bitcoin seed"), seed, "sha512");

        const key = new ExtPrivateKey();
        key.version = version;
        key.depth = 0;
        key.number = 0;
        key.parentFingerprint = Buffer.from([0, 0, 0, 0]);
        key.privateKey = l.slice(0, 32);
        key.chainCode = l.slice(32);
        return key;
    }

    public version: ExtKeyType;
    public depth: number;
    public parentFingerprint: Buffer;
    public number: number;
    public chainCode: Buffer;
    public privateKey: Buffer;

    private _publicKey: Buffer;
    private _fingerprint: Buffer;

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

    public toExtPublicKey(): ExtPublicKey {
        const result = new ExtPublicKey();
        result.version =
            this.version === ExtKeyType.MainnetPrivate
                ? ExtKeyType.MainnetPublic
                : ExtKeyType.TestnetPublic;
        result.depth = this.depth;
        result.number = this.number;
        result.fingerprint = Buffer.from(this.parentFingerprint);
        result.chainCode = Buffer.from(this.chainCode);
        result.publicKey = crypto.getPublicKey(this.privateKey, true);
        return result;
    }

    public derivePrivate(i: number): ExtPrivateKey {
        const result = new ExtPrivateKey();
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

        result.privateKey = crypto.privateKeyTweakAdd(ll, this.privateKey);
        result.chainCode = lr;

        return result;
    }

    public derivePublic(i: number): ExtPublicKey {
        return this.derivePrivate(i).toExtPublicKey();
    }
}

export class ExtPublicKey {
    public static decode(input: string): ExtPublicKey {
        const buf = Base58Check.decode(input);

        if (buf.length !== 78) {
            throw new ExtKeyError(ExtKeyErrorCode.InvalidEncoding, input);
        }

        const r = new BufferReader(buf);
        const version: ExtKeyType = r.readUInt32BE();
        const depth = r.readUInt8();
        const fingerprint = r.readBytes(4);
        const childNum = r.readUInt32BE();
        const chaincode = r.readBytes(32);
        const pubkey = r.readBytes(33);

        const key = new ExtPublicKey();
        key.version = version;
        key.depth = depth;
        key.fingerprint = fingerprint;
        key.number = childNum;
        key.chainCode = chaincode;

        if (version === ExtKeyType.MainnetPublic || version === ExtKeyType.TestnetPublic) {
            key.publicKey = pubkey;
        } else {
            throw new ExtKeyError(ExtKeyErrorCode.IncorrectKeyVersion, input);
        }

        return key;
    }

    public version: ExtKeyType;
    public depth: number;
    public fingerprint: Buffer;
    public number: number;
    public chainCode: Buffer;
    public publicKey: Buffer;
}
