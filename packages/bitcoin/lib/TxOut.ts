import { BufferWriter, StreamReader } from "@node-lightning/bufio";
import { Script } from "./Script";

export class TxOut {
    /**
     * Parses a TxOut from a stream and returns a new instance of TxOut
     * @param reader
     */
    public static parse(reader: StreamReader): TxOut {
        const amount = reader.readBigUInt64LE();
        const scriptPubKey = Script.parse(reader);
        return new TxOut(amount, scriptPubKey);
    }

    /**
     * Amount in satoshis that will be locked into the output using the
     * provided scriptPubKey. The combined outputs must be lte the
     * combined input value for in transaction.
     */
    public amount: bigint;

    /**
     * The locking script used to encumbered the value in the output.
     * To claim these funds as an input in another transaction requires
     * providing a ScriptSig that successfully evaluates when combined
     * with the ScriptPubKey.
     */
    public scriptPubKey: Script;

    /**
     * Constructs a new TxOut from the supplied arguments
     * @param amount
     * @param scriptPubKey
     */
    constructor(amount: bigint, scriptPubKey: Script) {
        this.amount = amount;
        this.scriptPubKey = scriptPubKey;
    }

    /**
     * Returns the TxOut as a string
     */
    public toString() {
        return `amount="${this.amount}", scriptPubKey="${this.scriptPubKey}"`;
    }

    /**
     * Returns the TxOut as a JSON object
     */
    public toJSON() {
        return {
            amount: this.amount.toString(),
            scriptPubKey: this.scriptPubKey.toJSON(),
        };
    }

    /**
     * Returns the serialization of the transaction output into a buffer
     */
    public serialize(): Buffer {
        const writer = new BufferWriter();
        writer.writeUInt64LE(this.amount);
        writer.writeBytes(this.scriptPubKey.serialize());
        return writer.toBuffer();
    }
}
