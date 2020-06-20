import { BufferReader } from "@lntools/bufio";

/**
 * Reads TLVs from a reader until the entire stream is processed. The handler is
 * responsible for doing something with the data bytes.
 * @param reader
 * @param handler
 */
export function readTlvs(reader: BufferReader, handler: (type: bigint, bytes: Buffer) => boolean) {
    let lastType: bigint;
    while (!reader.eof) {
        const type = reader.readBigSize();
        const len = reader.readBigSize();
        const bytes = reader.readBytes(Number(len));

        if (type <= lastType) {
            throw new Error("Invalid TLV stream");
        }

        const isEven = type % BigInt(2) === BigInt(0);
        const wasHandled = handler(type, bytes);

        if (!wasHandled && isEven) {
            throw new Error("Unknown even type");
        }

        lastType = type;
    }
}
