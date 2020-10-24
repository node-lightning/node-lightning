import { StreamReader } from "@node-lightning/bufio";
import { Readable } from "stream";

export class HashValue {
    /**
     * Parses a hashed value in RPC byte order (which is the reverse) of
     * the natural or internal byte order. This is often referred to as
     * big-endian due to the reversed block target being big-endian.
     * @param stream
     */
    public static parseRpcOrder(reader: StreamReader): HashValue {
        const value = reader.readBytes(32).reverse();
        return new HashValue(value);
    }

    /**
     * Parses a hashed value in internal byte order. This is often
     * referred to as little-endian due to the block target needing to
     * be reversed.
     * @param stream
     */
    public static parse(reader: StreamReader): HashValue {
        return new HashValue(reader.readBytes(32));
    }

    /**
     * Internal-byte-order version of the hash value
     */
    private _value: Buffer;

    /**
     * Constructs a new HashValue instance from the internal-byte-order
     * value provided.
     * @param value Interval-byte-order of a hash value
     */
    constructor(value: Buffer) {
        this._value = value;
    }

    /**
     * Returns the hash value in RPC (reversed/big endian) order.
     */
    public toString(): string {
        return Buffer.from(this._value).reverse().toString("hex");
    }

    /**
     * Serializes to JSON in RPC (reversed/big endian) order.
     */
    public toJSON(): any {
        return this.toString();
    }

    /**
     * Serializes the hash value into an internal-byte order Buffer
     */
    public serialize(): Buffer {
        return Buffer.from(this._value);
    }
}
