import * as crypto from "@node-lightning/crypto";
import { BufferWriter } from "../../bufio/dist";
import { BitcoinError } from "./BitcoinError";
import { BitcoinErrorCode } from "./BitcoinErrorCode";
import { HdKeyCodec } from "./HdKeyCodec";
import { HdKeyType } from "./HdKeyType";
import { HdPublicKey } from "./HdPublicKey";
import { Network } from "./Network";
import { PrivateKey } from "./PrivateKey";

const MAX_INDEX = 0xffffffff;
const HARDENED_INDEX = 0x80000000;
const BIP49_PURPOSE = 0x80000031; // 49'
const BIP84_PURPOSE = 0x80000054; // 84'

/**
 * Represnts a hierarchical deterministic extended private key as defined
 * in BIP32. This class contains helper methods to derive child keys and
 * manage derivation.
 */
export class HdPrivateKey {
    /**
     * Constructs an extended private key from a derivation path by
     * performing a sequence of private key derivations.
     *
     * For example: `m/0'/1`
     *
     * * Must start at the master key `m`
     * * Hardened indices include a tick, `'`, eg: `0'` or `100'`
     * * Each level is split with a `/`
     *
     * Derivation requires the seed, network, and type to correctly
     * derive the private key.
     *
     * @param path string path
     * @param seed 32-byte seed
     * @param network network that the private key belongs to
     * @param type type of HD key (x, y, z) which defaults to x when a
     * BIP49 or BIP84 path is not detected
     * @returns the extended private key at the defined path
     */
    public static fromPath(
        path: string,
        seed: Buffer,
        network: Network,
        type?: HdKeyType,
    ): HdPrivateKey {
        const parts = path.split("/");

        // verify that we start with 'm' and that there are at most 255
        // sub-parts
        if (parts[0] !== "m" || parts.length > 255) {
            throw new BitcoinError(BitcoinErrorCode.InvalidHdPath, path);
        }

        // calculate the nums before we do anything else
        const nums: number[] = [];
        for (let i = 1; i < parts.length; i++) {
            const part = parts[i];

            // extract number
            const hardened = part.endsWith("'");
            const num = hardened
                ? 2 ** 31 + Number(part.substring(0, part.length - 1))
                : Number(part);

            // validate path was correct
            if (isNaN(num) || num < 0 || num > MAX_INDEX || (!hardened && num >= HARDENED_INDEX)) {
                throw new BitcoinError(BitcoinErrorCode.InvalidHdPath, path);
            }

            nums.push(num);
        }

        // attempt to detect the type if one was not supplied...
        if (!type) {
            // purpose is 84', type is z
            if (nums[0] && nums[0] === BIP84_PURPOSE) {
                type = HdKeyType.z;
            }
            // purpose is 49', type is y
            else if (nums[0] && nums[0] === BIP49_PURPOSE) {
                type = HdKeyType.y;
            }
            // otherwise it's x
            else {
                type = HdKeyType.x;
            }
        }

        // generate the master key
        let key = HdPrivateKey.fromSeed(seed, network, type);

        // perform derivations from the master
        for (const num of nums) {
            key = key.derive(num);
        }

        return key;
    }

    /**
     * Generates the master extended private key from the seed.
     *
     * @remarks
     * The master key has a depth of 0 and an parent fingerprint of
     * 0x00000000. The master key is generated from the HMAC-SHA512
     * using the key "Bitcoin seed" and the 32-byte seed as the data
     * part.
     *
     * @param seed 32-byte seed
     * @param network network the key belongs to
     * @param type HD key type (x, y, z)
     * @returns master extended pivate key
     */
    public static fromSeed(seed: Buffer, network: Network, type = HdKeyType.x): HdPrivateKey {
        const l = crypto.hmac(Buffer.from("Bitcoin seed"), seed, "sha512");

        const key = new HdPrivateKey();
        key.type = type;
        key.depth = 0;
        key.number = 0;
        key.parentFingerprint = Buffer.from([0, 0, 0, 0]);
        key.chainCode = l.slice(32);
        key.privateKey = new PrivateKey(l.slice(0, 32), network);
        return key;
    }

    /**
     * Decodes an extended private key from the serialization format
     * defined in BIP32.
     *
     * For example:
     * xprv9s21ZrQH143K3QTDL4LXw2F7HEK3wJUD2nW2nRk4stbPy6cq3jPPqjiChkVvvNKmPGJxWUtg6LnF5kejMRNNU3TGtRBeJgk33yuGBxrMPHi
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
     * @returns an instance of the extended private key
     */
    public static decode(input: string): HdPrivateKey {
        const result = HdKeyCodec.decode(input);
        if (!(result instanceof HdPrivateKey)) {
            throw new BitcoinError(BitcoinErrorCode.InvalidHdPrivateKey, input);
        } else {
            return result;
        }
    }

    /**
     * The type of extended key. This ensures that xprv, yprv, and
     * zprv values are not used in the same path.
     */
    public type: HdKeyType;

    /**
     * The depth of the derivation path. Depth of 0 is the master key.
     * Maximum depth is 255 since this is encoded using a single byte.
     */
    public depth: number;

    /**
     * The parents fingerprint which is the first 4-bytes of the hash160
     * of the compressed public key. The fingerprint of the parent only
     * serves as a fast way to detect parent and child keys and software
     * must be willing to deal with collisions.
     */
    public parentFingerprint: Buffer;

    /**
     * Specifies the child key number. Values between 0 to 2^31-1 are
     * non-hardened. Values between 2^31 to 2^32-1 are hardened.
     */
    public number: number;

    /**
     * The extended private key's chaincode
     */
    public chainCode: Buffer;

    /**
     * The underlying private key instance for extended private key
     */
    public privateKey: PrivateKey;

    private _fingerprint: Buffer;

    /**
     * The network the extended private key belongs to
     */
    public get network(): Network {
        return this.privateKey.network;
    }

    /**
     * The numeric version of the extended private key. This value is
     * determiend by the network and is used to encode a prefix when
     * the extended private key is encoded as a string.
     */
    public get version(): number {
        switch (this.type) {
            case HdKeyType.x:
                return this.network.xprvVersion;
            case HdKeyType.y:
                return this.network.yprvVersion;
            case HdKeyType.z:
                return this.network.zprvVersion;
        }
    }

    /**
     * Returns true when the key is a hardened key. A key is hardened
     * when it has an index between 2^31 and 2^32-1
     */
    public get isHardened(): boolean {
        return this.number >= HARDENED_INDEX;
    }

    /**
     * Lazy loads the fingerprint of the current extended private key
     */
    public get fingerprint(): Buffer {
        if (!this._fingerprint) {
            this._fingerprint = crypto.hash160(this.privateKey.toPubKey(true).toBuffer());
        }
        return this._fingerprint;
    }

    /**
     * Derives the child private key at the specified index. This
     * method is capable of deriving both hardened and non-hardened
     * child keys.
     *
     * @remarks
     *
     * @param i number of key to derive
     * @returns
     */
    public derive(i: number): HdPrivateKey {
        const result = new HdPrivateKey();
        result.type = this.type;
        result.depth = this.depth + 1;
        result.number = i;
        result.parentFingerprint = Buffer.from(this.fingerprint.slice(0, 4));

        const data = new BufferWriter(Buffer.alloc(37));

        // hardened
        if (i >= HARDENED_INDEX) {
            data.writeUInt8(0);
            data.writeBytes(this.privateKey.toBuffer());
            data.writeUInt32BE(i);
        }
        // normal child
        else {
            data.writeBytes(this.privateKey.toPubKey(true).toBuffer());
            data.writeUInt32BE(i);
        }

        const l = crypto.hmac(this.chainCode, data.toBuffer(), "sha512");
        const ll = l.slice(0, 32);
        const lr = l.slice(32);

        result.privateKey = this.privateKey.tweakAdd(ll);
        result.chainCode = lr;

        return result;
    }

    /**
     * Constructs the corresponding {@link HdPublicKey}.
     *
     * The derivation is defined in BIP32 using HMAC-SHA512
     * {@link https://github.com/bitcoin/bips/blob/master/bip-0032.mediawiki}
     *
     * The derivation uses the parent's chaincode as the `key`. Then uses
     * for the `data`:
     *
     * * non-hardened: `parent_pub_key || i`
     * * hardened: `0x00 || parent_priv_key || i`
     *
     * As such the data is always 37-bytes.
     *
     * The resulting 64-bytes are split where where the left half is
     * used to tweakAdd against the parent private key. The right half
     * is the child's chain_code.
     *
     * @returns The corresponding extended public key
     */
    public toPubKey(): HdPublicKey {
        const result = new HdPublicKey();
        result.type = this.type;
        result.depth = this.depth;
        result.number = this.number;
        result.parentFingerprint = Buffer.from(this.parentFingerprint);
        result.chainCode = Buffer.from(this.chainCode);
        result.publicKey = this.privateKey.toPubKey(true);
        return result;
    }

    /**
     * Returns the compressed WIF encoding
     * @returns
     */
    public toWif(): string {
        return this.privateKey.toWif(true);
    }

    /**
     * Encodes the {@link HdPrivateKey} according to BIP32.
     *
     * For example:
     * xprv9s21ZrQH143K3QTDL4LXw2F7HEK3wJUD2nW2nRk4stbPy6cq3jPPqjiChkVvvNKmPGJxWUtg6LnF5kejMRNNU3TGtRBeJgk33yuGBxrMPHi
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
     * @returns Base58Check encoded extended private key
     */
    public encode(): string {
        return HdKeyCodec.encode(this);
    }
}
