import { StreamReader } from "@node-lightning/bufio";
import { HashByteOrder } from "./HashByteOrder";

export class HashValue {
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
     * Parses a hashed value in RPC byte order (which is the reverse) of
     * the natural or internal byte order. This is often referred to as
     * big-endian due to the reversed block target being big-endian.
     * @param stream
     */
    public static fromRpcStream(reader: StreamReader): HashValue {
        const value = reader.readBytes(32).reverse();
        return new HashValue(value);
    }

    /**
     * Parses a hashed value in RPC byte order (which is the reverse) of
     * the natural or internal byte order. This is often referred to as
     * big-endian due to the reversed block target being big-endian.
     * @param value
     */
    public static fromRpc(value: string): HashValue {
        const reader = StreamReader.fromHex(value);
        return this.fromRpcStream(reader);
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
     * Returns the hash value as a hex string. Defaults to using RPC
     * (reversed/big-endian) byte order.
     */
    public toString(byteOrder: HashByteOrder = HashByteOrder.RPC): string {
        if (byteOrder === HashByteOrder.RPC) {
            return Buffer.from(this._value).reverse().toString("hex"); // prettier-ignore
        } else {
            return Buffer.from(this._value).toString("hex");
        }
    }

    /**
     * Serializes to JSON returning a hex string. Defaults to using
     * RPC (reversed/big endian) byte order.
     */
    public toJSON(byteOrder?: HashByteOrder): any {
        return this.toString(byteOrder);
    }

    /**
     * Serializes the hash value into an internal-byte order Buffer
     */
    public serialize(byteOrder: HashByteOrder = HashByteOrder.Internal): Buffer {
        if (byteOrder === HashByteOrder.Internal) {
            return Buffer.from(this._value);
        } else {
            return Buffer.from(this._value).reverse();
        }
    }
}
