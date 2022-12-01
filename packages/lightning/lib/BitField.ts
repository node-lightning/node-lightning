import * as bigintutil from "./BigIntUtils";

/**
 * BitField assists with using bit flags to set or unset values in the bit
 * field. Preferrably a flag type is provided, otherwise it defaults to allow
 * arbitrary setting of integers corresponding to a particular bit index.
 *
 * Internally, values are stored as bigint so that more than 32 values
 * can be used since there is a limit of 31 digits that can be manipulated
 * using bitwise operations in JavaScript.
 */
export class BitField<T = number> {
    /**
     * Constructs a bitmask from a number
     */
    public static fromNumber(value: number) {
        return new BitField(BigInt(value));
    }

    /**
     * Constructs a bitmask from a buffer
     */
    public static fromBuffer(value: Buffer) {
        if (value.length === 0) return new BitField();
        return new BitField(BigInt("0x" + value.toString("hex")));
    }

    public value: bigint;

    constructor(value?: bigint) {
        this.value = value || BigInt(0);
    }

    public isSet(bit: T): boolean {
        return (this.value & (BigInt(1) << BigInt(bit))) > BigInt(0);
    }

    public anySet(...bits: T[]): boolean {
        for (const bit of bits) {
            if (this.isSet(bit)) return true;
        }
        return false;
    }

    public set(bit: T) {
        this.value |= BigInt(1) << BigInt(bit);
    }

    public unset(bit: T) {
        this.value &= ~(this.value & (BigInt(1) << BigInt(bit)));
    }

    public toggle(bit: T) {
        this.value ^= BigInt(1) << BigInt(bit);
    }

    /**
     * Returns the full list of set flags for the bit field
     */
    public flags(): T[] {
        const bits: T[] = [];
        let bit = 0;
        let val = 1n;
        while (val < this.value) {
            if (this.value & val) bits.push(bit as any);
            bit += 1;
            val <<= 1n;
        }
        return bits;
    }

    /**
     * Returns the index of the most-significant bit that is set
     */
    public msb(): number {
        let num = this.value;
        let bit = 0;
        while (num > 1) {
            num = num >> 1n;
            bit += 1;
        }
        return bit;
    }

    /**
     * Returns a new BitField with the bitwise AND of the two BitFields
     * @param bitfield
     */
    public and(bitfield: BitField): BitField {
        return new BitField(this.value & bitfield.value);
    }

    /**
     * Returns a new BitField with the bitwise OR of the two BitFields
     * @param bitfield
     */
    public or(bitfield: BitField): BitField {
        return new BitField(this.value | bitfield.value);
    }

    /**
     * Returns a new BitField with the bitwise XOR of the two BitFields
     * @param bitfield
     */
    public xor(bitfield: BitField): BitField {
        return new BitField(this.value ^ bitfield.value);
    }

    public toBigInt() {
        return this.value;
    }

    public toNumber() {
        return Number(this.value);
    }

    public toBuffer(): Buffer {
        if (this.value === BigInt(0)) return Buffer.alloc(0);
        return bigintutil.bigintToBuffer(this.value);
    }
}
