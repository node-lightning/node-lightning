import { Readable } from "stream";

/**
 * Converts a buffer to a Readable stream.
 */
export function bufToStream(buf: Buffer): Readable {
    const result = new Readable();
    result.push(buf);
    result.push(null); // ends the stream
    return result;
}
