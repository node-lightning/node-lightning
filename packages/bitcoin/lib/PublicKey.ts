import * as crypto from "@node-lightning/crypto";
import { PrivateKey } from "./PrivateKey";
import { Script } from "./Script";
import { Address } from "./Address";
import { BitcoinError } from "./BitcoinError";
import { BitcoinErrorCode } from "./BitcoinErrorCode";
import { Network } from "./Network";

/**
 * This class represents a point on an secp256k1 elliptic curve and acts
 * as a public key along with the network for which the key belongs. The
 * public key can be serialized into a buffer using the SEC compressed
 * and uncompressed format.
 */
export class PublicKey {
    /**
     * Returns the public key associated with the WIF input
     * @param input WIF encoded private key
     * @returns public key assocated with the WIF encoding
     */
    public static fromWif(input: string): PublicKey {
        const [, pubkey] = PrivateKey.fromWif(input);
        return pubkey;
    }

    public readonly compressed: boolean;
    private readonly _buffer: Buffer;

    /**
     * Constructs a new instance of a PublicKey and requires a valid key
     * or an exception will be throw.
     * @param buffer A valid 33-byte or 65-byte SEC encoded public key
     * @param network The corresponding network where the public key belongs
     */
    constructor(buffer: Buffer, readonly network: Network) {
        if (!crypto.validPublicKey(buffer)) {
            throw new BitcoinError(BitcoinErrorCode.PubKeyInvalid, { key: buffer });
        }

        this.compressed = buffer.length === 33;
        this._buffer = buffer;
    }

    /**
     * Tweaks a public key by adding tweak * G to the point. The equation is
     * T = P + t*G
     *
     * @param tweak 32-byte scalar value that is multiplied by G
     * @returns a new instance of PublicKey containing the tweaked value
     */
    public tweakAdd(tweak: Buffer) {
        const result = crypto.publicKeyTweakAdd(this._buffer, tweak, this.compressed);
        return new PublicKey(result, this.network);
    }

    /**
     * Tweaks a public key by multiplying it against a scalar. The equation is
     * T = P * t
     *
     * @param tweak 32-byte tweak to multiply against the public key
     * @returns a new instance of PublicKey containing the tweaked value
     */
    public tweakMul(tweak: Buffer) {
        const result = crypto.publicKeyTweakMul(this._buffer, tweak, true);
        return new PublicKey(result, this.network);
    }

    /**
     * Adds two public key points together.
     * @param other The other public key that should be added
     * @returns a new instance of PublicKey containing the added points
     */
    public add(other: PublicKey): PublicKey {
        if (this.network !== other.network) {
            throw new BitcoinError(BitcoinErrorCode.NetworkMismatch, { me: this, other });
        }
        const result = crypto.publicKeyCombine(
            [this.toBuffer(), other.toBuffer()],
            this.compressed,
        );
        return new PublicKey(result, this.network);
    }

    /**
     * Returns the hash160 of the public key
     * @returns 20-byte hash160 of the public key
     */
    public hash160(): Buffer {
        return crypto.hash160(this.toBuffer());
    }

    /**
     * Convert the public key to compressed or uncompressed.
     * @param compressed
     */
    public toPubKey(compressed: boolean): PublicKey {
        const buffer = crypto.convertPublicKey(this._buffer, compressed);
        return new PublicKey(buffer, this.network);
    }

    /**
     * Serializes the PublicKey instance into a 33-byte or 65-byte SEC
     * encoded buffer depending on whether the public key is compressed
     * or uncompressed.
     * @returns 33-byte or 65-byte buffer
     */
    public toBuffer(): Buffer {
        return Buffer.from(this._buffer);
    }

    /**
     * Serializes the PublicKey instance nito a 33-byte or 65-byte SEC
     * encoded hex value.
     * @returns
     */
    public toHex(): string {
        return this.toBuffer().toString("hex");
    }

    /**
     * Returns a P2PKH for the public key.
     * @returns Base58 encoded Bitcoin address
     */
    public toP2pkhAddress(): string {
        return Address.encodeBase58(this.network.p2pkhPrefix, this.hash160());
    }

    /**
     * Returns a nested segwit addrress (P2SH-P2WPKH).
     * @returns Base58 encoded Bitcoin address
     */
    public toP2nwpkhAddress(): string {
        return Address.encodeBase58(
            this.network.p2shPrefix,
            Script.p2wpkhLock(this.hash160()).hash160(),
        );
    }

    /**
     * Returns a P2WPKH address for the public key.
     * @returns bech32 encoded segwit address
     */
    public toP2wpkhAddress(): string {
        return Address.encodeBech32(this.network.p2wpkhPrefix, 0, this.hash160());
    }
}
