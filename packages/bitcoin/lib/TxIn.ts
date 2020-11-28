import { BufferWriter, StreamReader } from "@node-lightning/bufio";
import { HashValue } from "./HashValue";
import { OutPoint } from "./OutPoint";
import { Script } from "./Script";
import { TxInSequence } from "./TxInSequence";
import { Witness } from "./Witness";

export class TxIn {
    /**
     * Parses a TxIn from a a stream reader.
     * @param stream
     */
    public static parse(reader: StreamReader): TxIn {
        const outpoint = OutPoint.parse(reader);
        const scriptSig = Script.parse(reader);
        const sequence = new TxInSequence(reader.readUInt32LE());
        return new TxIn(outpoint, scriptSig, sequence);
    }

    /**
     * The previous transaction output tuple
     */
    public outpoint: OutPoint;

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
    public witness: Witness[];

    /**
     * Constructs a new transaction input from the values
     * @param outpoint
     * @param scriptSig
     * @param sequence
     */
    constructor(
        outpoint: OutPoint,
        scriptSig: Script = new Script(),
        sequence: TxInSequence = new TxInSequence(),
    ) {
        this.outpoint = outpoint;
        this.scriptSig = scriptSig;
        this.sequence = sequence;
        this.witness = [];
    }

    /**
     * Creates a string of the transaction input that includes all of the
     * properties.
     */
    public toString() {
        return `prev=${this.outpoint.toString()}, scriptSig=${this.scriptSig.toString()}, sequence=${this.sequence.toString()}`; // prettier-ignore
    }

    /**
     * Creates a JSON object of the transaction input that includes all
     * of the properties.
     */
    public toJSON() {
        return {
            outpoint: this.outpoint.toJSON(),
            scriptSig: this.scriptSig.toJSON(),
            sequence: this.sequence.toJSON(),
        };
    }

    /**
     * Returns the byte serialization of the transaction input
     */
    public serialize(): Buffer {
        const writer = new BufferWriter();
        writer.writeBytes(this.outpoint.serialize());
        writer.writeBytes(this.scriptSig.serialize());
        writer.writeBytes(this.sequence.serialize());
        return writer.toBuffer();
    }
}
