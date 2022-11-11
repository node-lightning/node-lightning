import { bigToBufBE, BufferReader, BufferWriter } from "@node-lightning/bufio";

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
    public static fromBuffer(buf: Buffer): Bits {
        const reader = new BufferReader(buf);
        const coefficient = reader.readUIntLE(3);
        const exponent = reader.readUInt8();
        return new Bits(coefficient, exponent);
    }

    /**
     * Converts a target into a `Bits` instance. This is the inverse of
     * the `target` property on a `Bits` instance. The algorithm to
     * convert a target is to write the number into a Buffer in
     * big-endian. The required bytes is the exponent and the
     * coefficient is the top three most bytes. If the topmost bit is
     * set then we
     * @param target
     */
    public static fromTarget(target: bigint): Bits {
        let exponent: number;
        let coefficient: number;

        // Convert the number to BE bytes
        const rawBytes = bigToBufBE(target);

        // The target is always positive, therefore we need to prevent this from
        // being treated as a negative number. If the first bit is a 1 (>=0x80),
        // push a 0x00 as the first byte of the coefficient
        if (rawBytes[0] > 0x7f) {
            exponent = rawBytes.length + 1;
            coefficient = (rawBytes[0] << 8) + rawBytes[1];
        } else {
            exponent = rawBytes.length;
            coefficient = (rawBytes[0] << 16) + (rawBytes[1] << 8) + rawBytes[2];
        }

        return new Bits(coefficient, exponent);
    }

    /**
     * Constructs a new `Bits` instance.
     * @param coefficient
     * @param exponent
     */
    constructor(readonly coefficient: number, readonly exponent: number) {}

    /**
     * Serializes the bits to a Buffer in the format used for RPC block
     * serialization. This means that hte lower three bytes are the
     * coefficient little-endian and the upper byte is the exponent.
     * One final piece of complexity is that if the coefficient is
     * greater than 0x800000 then we pad it and
     */
    public toBuffer(): Buffer {
        const writer = new BufferWriter(Buffer.alloc(4));
        writer.writeUIntLE(this.coefficient, 3);
        writer.writeUInt8(this.exponent);
        return writer.toBuffer();
    }

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
