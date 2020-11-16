import { BufferWriter, StreamReader } from "@node-lightning/bufio";
import { HashValue } from "./HashValue";
import { Script } from "./Script";
import { ScriptCmd } from "./ScriptCmd";
import { TxInSequence } from "./TxInSequence";

export class TxIn {
    /**
     * Parses a TxIn from a a stream reader.
     * @param stream
     */
    public static parse(reader: StreamReader): TxIn {
        const prevTxId = HashValue.parse(reader);
        const prevTxIndex = reader.readUInt32LE();
        const scriptSig = Script.parse(reader);
        const sequence = new TxInSequence(reader.readUInt32LE());
        return new TxIn(prevTxId, prevTxIndex, scriptSig, sequence);
    }

    /**
     * The identifier for the previous transaction that the input spends
     * from.
     */
    public prevTxId: HashValue;

    /**
     * The index of the previous transaction that the input spends from.
     */
    public prevTxIndex: number;

    /**
     * ScriptSig for the input
     */
    public scriptSig: Script;

    /**
     * nSequence value for the transaction. Defaults to 0xffffffff which
     * disables the absolute timelock.
     */
    public sequence: TxInSequence;

    /**
     * Witness data that is required by the input
     */
    public witness: ScriptCmd[];

    /**
     * Constructs a new transaction input from the values
     * @param prevTxId
     * @param prevTxIndex
     * @param scriptSig
     * @param sequence
     */
    constructor(
        prevTxId: HashValue,
        prevTxIndex: number,
        scriptSig: Script = new Script(),
        sequence: TxInSequence = new TxInSequence(),
    ) {
        this.prevTxId = prevTxId;
        this.prevTxIndex = prevTxIndex;
        this.scriptSig = scriptSig;
        this.sequence = sequence;
    }

    /**
     * Creates a string of the transaction input that includes all of the
     * properties.
     */
    public toString() {
        return `prev=${this.prevTxId.toString()}, prevIdx=${this.prevTxIndex}, scriptSig=${this.scriptSig.toString()}, sequence=${this.sequence.toString()}`; // prettier-ignore
    }

    /**
     * Creates a JSON object of the transaction input that includes all
     * of the properties.
     */
    public toJSON() {
        return {
            prevTxId: this.prevTxId.toJSON(),
            prevTxIndex: this.prevTxIndex,
            scriptSig: this.scriptSig.toJSON(),
            sequence: this.sequence.toJSON(),
        };
    }

    /**
     * Returns the byte serialization of the transaction input
     */
    public serialize(): Buffer {
        const writer = new BufferWriter();
        writer.writeBytes(this.prevTxId.serialize());
        writer.writeUInt32LE(this.prevTxIndex);
        writer.writeBytes(this.scriptSig.serialize());
        writer.writeBytes(this.sequence.serialize());
        return writer.toBuffer();
    }
}
