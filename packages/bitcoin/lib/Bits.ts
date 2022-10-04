import { BufferReader } from "@node-lightning/bufio";

/**
 * Bits encodes the proof-of-work necessary in this block. It contains
 * two parts: exponent and coefficient. It is a succinct way to express
 * a really large number. It can be converted into a `target` or the
 * `difficulty`.
 */
export class Bits {
    /**
     * Parses nBits from a LE buffer as represented inside of a block
     * where first three bytes are the coefficient and the last byte
     * is the exponent.
     * @param buf
     * @returns
     */
    public static fromBuffer(buf: Buffer) {
        const reader = new BufferReader(buf);
        const coefficient = reader.readUIntLE(3);
        const exponent = reader.readUInt8();
        return new Bits(coefficient, exponent);
    }

    constructor(readonly coefficient: number, readonly exponent: number) {}

    /**
     * Calculates the proof-of-work requirements from the bits. Target
     * is calculated as:
     *
     * ```
     * target = coefficient * 256^(exponent-3)
     * ```
     *
     * The target looks like:
     * 0000000000000000013ce9000000000000000000000000000000000000000000
     *
     */
    public get target(): bigint {
        const exp = BigInt(this.exponent);
        const coeff = BigInt(this.coefficient);
        return coeff * 256n ** (exp - 3n);
    }

    /**
     * Difficulty is a more readable version of the target and makes the
     * targets more easy to compare and comprehend. The genesis block
     * had a difficulty of 1.
     *
     * It is calculated with the formula:
     *
     * ```
     * difficulty = 0xffff * 256 ^ (0x1d - 3) / target
     * ```
     */
    public get difficulty(): bigint {
        const genesis = 0xffffn * 256n ** (0x1dn - 3n);
        return genesis / this.target;
    }
}
