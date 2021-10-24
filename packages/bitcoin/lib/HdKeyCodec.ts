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
            } else if (version === network.ypubVersion) {
                return [network, HdKeyType.y, false];
            } else if (version === network.yprvVersion) {
                return [network, HdKeyType.y, true];
            }
        }
        throw new BitcoinError(BitcoinErrorCode.UnkownHdKeyVersion, version.toString());
    }

    /**
     * Decodes an extended private key or public key from the
     * serialization format defined in BIP32.
     *
     * For example:
     * xprv9s21ZrQH143K3QTDL4LXw2F7HEK3wJUD2nW2nRk4stbPy6cq3jPPqjiChkVvvNKmPGJxWUtg6LnF5kejMRNNU3TGtRBeJgk33yuGBxrMPHi
     * xpub661MyMwAqRbcFtXgS5sYJABqqG9YLmC4Q1Rdap9gSE8NqtwybGhePY2gZ29ESFjqJoCu1Rupje8YtGqsefD265TMg7usUDFdp6W1EGMcet8
     *
     * @remarks
     *
     * The value uses a prefix of xprv, yprv, or zprv and is Base58Check.
     *
     * ```
     * The format includes:
     * [4 byte]: version
     * [1 byte]: depth
     * [4 byte]: parent fingerprint
     * [4 byte]: number
     * [32 byte]: chaincode
     * [33 byte]: key
     * ```
     *
     * The 33-byte key values uses a 0x00 prefix plus the 32-byte private
     * key.
     *
     * @param input encoded input
     *
     * @throws {@link BitcoinError} throws when there is an invalid
     * encoding, bad checksum, or if you attempt to decode a public key.
     *
     * @returns an instance of the extended private key or public key
     */
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
        key.type = type;
        key.depth = depth;
        key.parentFingerprint = parentFingerprint;
        key.number = childNum;
        key.chainCode = chaincode;

        return key;
    }

    /**
     * Encodes either a {@link HdPrivateKey} or {@link HdPublicKey}
     * according to BIP32.
     *
     * For example:
     * xprv9s21ZrQH143K3QTDL4LXw2F7HEK3wJUD2nW2nRk4stbPy6cq3jPPqjiChkVvvNKmPGJxWUtg6LnF5kejMRNNU3TGtRBeJgk33yuGBxrMPHi
     * xpub661MyMwAqRbcFtXgS5sYJABqqG9YLmC4Q1Rdap9gSE8NqtwybGhePY2gZ29ESFjqJoCu1Rupje8YtGqsefD265TMg7usUDFdp6W1EGMcet8
     *
     * @remarks
     * The value uses a prefix of xprv, yprv, or zprv and is Base58Check
     * encoded.
     *
     * The format includes:
     * ```
     * [4 byte]: version
     * [1 byte]: depth
     * [4 byte]: parent fingerprint
     * [4 byte]: number
     * [32 byte]: chaincode
     * [33 byte]: key
     * ```
     *
     * For private keys, the 33-byte key value is prefixed with 0x00.
     *
     * @returns Base58Check encoded extended key
     */
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
