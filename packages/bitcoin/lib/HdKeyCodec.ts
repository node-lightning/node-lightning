import { BufferReader, BufferWriter } from "@node-lightning/bufio";
import { BitcoinErrorCode } from "./BitcoinErrorCode";
import { BitcoinError } from "./BitcoinError";
import { HdKeyType } from "./HdKeyType";
import { Network } from "./Network";
import { HdPrivateKey } from "./HdPrivateKey";
import { Base58Check } from "./Base58Check";
import { PrivateKey } from "./PrivateKey";
import { PublicKey } from "./PublicKey";
import { HdPublicKey } from "./HdPublicKey";

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
