import * as crypto from "@node-lightning/crypto";
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
        const result = crypto.publicKeyTweakAdd(this._buffer, tweak, true);
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
        const result = crypto.publicKeyCombine([this.toBuffer(true), other.toBuffer(true)], true);
        return new PublicKey(result, this.network);
    }

    /**
     * Returns the hash160 of the public key
     * @param compressed
     * @returns 20-byte hash160 of the public key
     */
    public hash160(compressed: boolean): Buffer {
        return crypto.hash160(this.toBuffer(compressed));
    }

    /**
     * Serializes the PublicKey instance into a 33-byte or 65-byte SEC
     * encoded buffer.
     * @param compressed
     * @returns 33-byte or 65-byte buffer
     */
    public toBuffer(compressed: boolean = true): Buffer {
        return crypto.convertPublicKey(this._buffer, compressed);
    }

    /**
     * Serializes the PublicKey instance nito a 33-byte or 65-byte SEC
     * encoded hex value.
     * @param compressed
     * @returns
     */
    public toHex(compressed: boolean = true): string {
        return this.toBuffer(compressed).toString("hex");
    }

    /**
     * Returns a P2PKH for the public key.
     * @param compressed
     * @returns Base58 encoded Bitcoin address
     */
    public toLegacyAddress(compressed: boolean): string {
        return Address.encodeLegacy(this.network.p2pkhPrefix, this.hash160(compressed));
    }

    /**
     * Returns a P2WPKH address for the public key.
     * @returns bech32 encoded segwit address
     */
    public toSegwitAddress(): string {
        return Address.encodeSegwit(this.network.p2wpkhPrefix, 0, this.hash160(true));
    }
}
