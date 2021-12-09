import * as crypto from "@node-lightning/crypto";
import { BitcoinError } from "./BitcoinError";
import { BitcoinErrorCode } from "./BitcoinErrorCode";
import { BufferWriter } from "@node-lightning/bufio";
import { HdKeyCodec } from "./HdKeyCodec";
import { HdKeyType } from "./HdKeyType";
import { Network } from "./Network";
import { PublicKey } from "./PublicKey";

const HARDENED_INDEX = 0x80000000;

/**
 * A hierarchical deterministic extended public key as defined in BIP32.
 * This class allows derivation of unhardened public keys. It may be
 * generated from a derivation, decoded, or obtained a parent.
 * {@link HdPrivateKey}.
 */
export class HdPublicKey {
    /**
     * Decodes an extended private key from the serialization format
     * defined in BIP32.
     *
     * For example:
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
     * @param input encoded input
     *
     * @throws {@link BitcoinError} throws when there is an invalid
     * encoding, bad checksum, or if you attempt to decode a private key.
     *
     * @returns an instance of the extended public key
     */
    public static decode(input: string): HdPublicKey {
        const result = HdKeyCodec.decode(input);
        if (!(result instanceof HdPublicKey)) {
            throw new BitcoinError(BitcoinErrorCode.InvalidHdPublicKey, input);
        }
        return result;
    }

    /**
     * Indicates if this is an xpub, ypub, or zpub public key.
     */
    public type: HdKeyType;

    /**
     * The depth of key from 0 to 255.
     */
    public depth: number;

    /**
     * The 4-byte fingerprint of the parent compressed public key. The
     * fingerprint of the parent only serves as a fast way to detect
     * parent and child keys and software must be willing to deal with
     * collisions.
     */
    public parentFingerprint: Buffer;

    /**
     * The key number. Values of 0 to 2^31-1 are normal keys. Values of
     * 2^31 to 2^32-1 are hardened and the derive method will throw an
     * error.
     */
    public number: number;

    /**
     * The chaincode used to derive the public key
     */
    public chainCode: Buffer;

    /**
     * The underlying secp256k1 point
     */
    public publicKey: PublicKey;

    private _fingerprint: Buffer;

    /**
     * Gets the numeric version from the underlying network
     */
    public get version(): number {
        switch (this.type) {
            case HdKeyType.x:
                return this.network.xpubVersion;
            case HdKeyType.y:
                return this.network.ypubVersion;
            case HdKeyType.z:
                return this.network.zpubVersion;
        }
    }

    /**
     * Gets the network this public key is associated with
     */
    public get network(): Network {
        return this.publicKey.network;
    }

    /**
     * Returns true if the public key is hardened, meaning the number
     * is between 2^31 and 2^32-1.
     */
    public get isHardened(): boolean {
        return this.number >= HARDENED_INDEX;
    }

    /**
     * Lazy loads the fingerprint of the public key. This is defined as
     * the `hash160(compressed_pubkey)`;
     */
    public get fingerprint(): Buffer {
        if (!this._fingerprint) {
            this._fingerprint = crypto.hash160(this.publicKey.toBuffer());
        }
        return this._fingerprint;
    }

    /**
     * This function computes a child extended public key from the parent
     * extened public key. It is only defined for non-hardened child keys.
     *
     * @remarks
     *
     * The derivation is defined in BIP32 using HMAC-SHA512
     * {@link https://github.com/bitcoin/bips/blob/master/bip-0032.mediawiki}
     *
     * The derivation uses the parent's chaincode as the key.  Then uses
     * `parent public key || i` as the HMAC data.
     *
     * The resulting 64-bytes are split where where the left half is
     * used to tweakAdd against the parent public key. The right half
     * is the child's chain_code.
     *
     * @param i key number to derive, must be less than 2^31-1
     *
     * @throws {@link BitcoinError} throws an `InvalidHdDerivation` error
     * code if there is an attempt to derive a hardened child key.
     *
     * @returns child non-hardened {@link HdPublicKey}
     */
    public derive(i: number): HdPublicKey {
        // From here on we're working with a public key, so we cannot
        // derive hardened public keys since they require the private
        // key as part of the derivation data.
        if (i >= HARDENED_INDEX) {
            throw new BitcoinError(BitcoinErrorCode.InvalidHdDerivation);
        }

        const data = new BufferWriter(Buffer.alloc(37));
        data.writeBytes(this.publicKey.toBuffer());
        data.writeUInt32BE(i);

        const l = crypto.hmac(this.chainCode, data.toBuffer(), "sha512");
        const ll = l.slice(0, 32);
        const lr = l.slice(32);

        const childPubKey = this.publicKey.tweakAdd(ll);
        const childChainCode = lr;

        const child = new HdPublicKey();
        child.type = this.type;
        child.depth = this.depth + 1;
        child.number = this.number;
        child.publicKey = childPubKey;
        child.chainCode = childChainCode;

        return child;
    }

    /**
     * Encodes the {@link HdPublicKey} according to BIP32.
     *
     * For example:
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
     * @returns Base56Check encoded extended public key
     */
    public encode(): string {
        return HdKeyCodec.encode(this);
    }

    /**
     * Returns the address encoded according to the type of HD key.
     * For x-type this returns a base58 encoded P2PKH address.
     * For y-type this returns a base58 encoded P2SH-P2WPKH address.
     * For z-type this returns a bech32 encoded P2WPKH address.
     * @returns encoded address
     */
    public toAddress(): string {
        switch (this.type) {
            case HdKeyType.x:
                return this.publicKey.toP2pkhAddress();
            case HdKeyType.y:
                return this.publicKey.toP2nwpkhAddress();
            case HdKeyType.z:
                return this.publicKey.toP2wpkhAddress();
        }
    }

    /**
     * Sugar for `instance.publicKey.toBuffer()` and returns the SEC
     * encoded public key in compressed or uncompressed format.
     * @returns
     */
    public toSecBuffer(): Buffer {
        return this.publicKey.toBuffer();
    }

    /**
     * Sugar for `instance.publicKey.toHex()` and returns the SEC
     * encoded public key as a hex string in compressed or uncompressed
     * format.
     * @returns
     */
    public toSecHex(): string {
        return this.publicKey.toHex();
    }
}
