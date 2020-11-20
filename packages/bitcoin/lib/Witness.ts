import { BufferWriter, StreamReader } from "@node-lightning/bufio";

/**
 * Represents segregated witness data. This data is nothing more than a
 * buffer.
 */
export class Witness {
    /**
     * Parses witness data
     * @param reader
     */
    public static parse(reader: StreamReader): Witness {
        const len = reader.readVarInt();
        const data = reader.readBytes(Number(len));
        return new Witness(data);
    }

    constructor(readonly data: Buffer) {}

    /**
     * Serializes witness data into a buffer in the format:
     *
     * [varint] length
     * [length] data
     */
    public serialize(): Buffer {
        const writer = new BufferWriter();
        writer.writeVarInt(this.data.length);
        writer.writeBytes(this.data);
        return writer.toBuffer();
    }

    /**
     * Returns the string of a piece of witness data
     */
    public toString() {
        return this.data.toString("hex");
    }

    /**
     * Returns the string of a piece of witness data
     */
    public toJSON() {
        return this.toString();
    }
}
