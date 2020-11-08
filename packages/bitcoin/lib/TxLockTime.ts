import { BufferWriter, StreamReader } from "@node-lightning/bufio";
import { TimeLockMode } from "./TimeLockMode";

const DEFAULT_LOCKTIME = 0xffff_ffff;
const TIME_THRESHOLD = 500_000_000;

/**
 * Specifies the absolute lock time for a transaction referred in the
 * reference implementation as nLocktime. An absolute locktime is only
 * active when its value is less than 0xffff_ffff and at least one
 * transaction input has a non-0xffff_ffff nSequence.
 */
export class TxLockTime {
    /**
     * Parses a locktime from a reader
     * @param reader
     */
    public static parse(reader: StreamReader): TxLockTime {
        return new TxLockTime(reader.readUInt32LE());
    }

    /**
     * Gets or sets the value of the timelock. The value must be less than
     * the maximum allowed value of 0xffff_ffff. When set to the max
     * value, the locktime is disabled.
     */
    public get value(): number {
        return this._value;
    }

    public set value(val: number) {
        if (val > DEFAULT_LOCKTIME || val < 0) throw new Error("Invalid nLocktime");
        this._value = val;
    }

    private _value: number;

    /**
     * Creates a new locktime instance
     * @param value defaults to 0xffff_ffff
     */
    constructor(value: number = DEFAULT_LOCKTIME) {
        this.value = value;
    }

    /**
     * True when a non-default is configured. This flag has no
     * knowledge if the locktime is fully enabled with the requirement
     * that at least one tx input has an nSequence value that non-default.
     */
    public get isEnabled(): boolean {
        return this.value < DEFAULT_LOCKTIME;
    }

    /**
     * Gets the type of lock time: Block or Time based
     */
    public get type(): TimeLockMode {
        if (this.value < TIME_THRESHOLD) return TimeLockMode.Block;
        else return TimeLockMode.Time;
    }

    /**
     * Returns the string value
     */
    public toString(): string {
        return this.value.toString();
    }

    /**
     * Returns the JSON serialized value
     */
    public toJSON() {
        return this.value;
    }

    /**
     * Serializes the locktime into a Buffer
     */
    public serialize(): Buffer {
        const writer = new BufferWriter(Buffer.alloc(4));
        writer.writeUInt32LE(this.value);
        return writer.toBuffer();
    }
}
