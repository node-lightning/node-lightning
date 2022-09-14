import { BufferWriter, StreamReader } from "@node-lightning/bufio";
import { ICloneable } from "./ICloneable";
import { OutPoint } from "./OutPoint";
import { Script } from "./Script";
import { Sequence } from "./Sequence";
import { Witness } from "./Witness";

export class TxIn implements ICloneable<TxIn> {
    /**
     * Parses a TxIn from a a stream reader.
     * @param stream
     */
    public static parse(reader: StreamReader): TxIn {
        const outpoint = OutPoint.parse(reader);
        const scriptSig = Script.parse(reader);
        const sequence = new Sequence(reader.readUInt32LE());
        return new TxIn(outpoint, scriptSig, sequence);
    }

    /**
     * Parses a hex string serialization of a transaction input. This
     * is a helper function instead of having to do `StreamReader.fromHex`
     * on a string directly.
     * @param hex
     */
    public static fromHex(hex: string): TxIn {
        const reader = StreamReader.fromHex(hex);
        return this.parse(reader);
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
    public sequence: Sequence;

    /**
     * Witness data that is required by the input
     */
    public witness: Witness[];

    /**
     * Constructs a new transaction input from the values
     * @param outpoint
     * @param scriptSig
     * @param sequence
     * @param witness
     */
    constructor(
        outpoint: OutPoint,
        scriptSig: Script = new Script(),
        sequence: Sequence = new Sequence(),
        witness: Witness[] = [],
    ) {
        this.outpoint = outpoint;
        this.scriptSig = scriptSig;
        this.sequence = sequence;
        this.witness = witness;
    }

    /**
     * Adds witness to the input's witness colletion
     * @param witness
     */
    public addWitness(witness: Buffer | Witness) {
        this.witness.push(Buffer.isBuffer(witness) ? new Witness(witness) : witness);
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
            witness: this.witness.map(witness => witness.toJSON()),
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

    /**
     * Clone via deep copy
     */
    public clone(): TxIn {
        return new TxIn(
            this.outpoint.clone(),
            this.scriptSig.clone(),
            this.sequence.clone(),
            this.witness.map(p => p.clone()),
        );
    }
}
