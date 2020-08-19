import { BufferReader } from "@node-lightning/bufio";

/**
 * Reads TLVs from a reader until the entire stream is processed. The handler is
 * responsible for doing something with the data bytes.
 * @param reader
 * @param handler
 */
export function readTlvs(
    reader: BufferReader,
    handler: (type: bigint, value: BufferReader) => boolean,
) {
    let lastType: bigint;
    while (!reader.eof) {
        const type = reader.readBigSize();
        const len = reader.readBigSize();
        const value = reader.readBytes(Number(len));
        const valueReader = new BufferReader(value);

        if (type <= lastType) {
            throw new Error("Invalid TLV stream");
        }

        const isEven = type % BigInt(2) === BigInt(0);
        const wasHandled = handler(type, valueReader);

        if (!wasHandled && isEven) {
            throw new Error("Unknown even type");
        }

        if (wasHandled && !valueReader.eof) {
            throw new Error("Non-canonical length");
        }

        lastType = type;
    }
}
