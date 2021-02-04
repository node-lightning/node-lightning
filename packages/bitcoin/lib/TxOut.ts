import { BufferWriter, StreamReader } from "@node-lightning/bufio";
import { ICloneable } from "./ICloneable";
import { Script } from "./Script";
import { Value } from "./Value";

export class TxOut implements ICloneable<TxOut> {
    /**
     * Parses a TxOut from a stream and returns a new instance of TxOut
     * @param reader
     */
    public static parse(reader: StreamReader): TxOut {
        const value = Value.fromSats(reader.readBigUInt64LE());
        const scriptPubKey = Script.parse(reader);
        return new TxOut(value, scriptPubKey);
    }

    /**
     * Parses a hex string serialization of a transaction output. This
     * is a helper function instead of having to do `StreamReader.fromHex`
     * on a string directly.
     * @param hex
     */
    public static fromHex(hex: string): TxOut {
        const reader = StreamReader.fromHex(hex);
        return TxOut.parse(reader);
    }

    /**
     * Value (often in satoshi or bitcoin) that will be locked into the
     * output using the provided scriptPubKey. The combined outputs must
     * be lte the combined input value for in transaction.
     */
    public value: Value;

    /**
     * The locking script used to encumbered the value in the output.
     * To claim these funds as an input in another transaction requires
     * providing a ScriptSig that successfully evaluates when combined
     * with the ScriptPubKey.
     */
    public scriptPubKey: Script;

    /**
     * Constructs a new TxOut from the supplied arguments
     * @param value
     * @param scriptPubKey
     */
    constructor(value: Value, scriptPubKey: Script) {
        this.value = value;
        this.scriptPubKey = scriptPubKey;
    }

    /**
     * Returns the TxOut as a string
     */
    public toString() {
        return `value="${this.value.sats}", scriptPubKey="${this.scriptPubKey}"`;
    }

    /**
     * Returns the TxOut as a JSON object
     */
    public toJSON() {
        return {
            value: this.value.sats.toString(),
            scriptPubKey: this.scriptPubKey.toJSON(),
        };
    }

    /**
     * Returns the serialization of the transaction output into a buffer
     */
    public serialize(): Buffer {
        const writer = new BufferWriter();
        writer.writeUInt64LE(this.value.sats);
        writer.writeBytes(this.scriptPubKey.serialize());
        return writer.toBuffer();
    }

    /**
     * Clone via deep copy
     */
    public clone(): TxOut {
        return new TxOut(this.value.clone(), this.scriptPubKey.clone());
    }
}
