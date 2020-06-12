import { BufferCursor } from "@lntools/buffer-cursor";
import { AddressTor2 } from "../../domain/AddressTor2";
import { torStringFromBuffer } from "./torStringFromBuffer";

/**
 * Deserializes a TOR v2 address from a BufferCursor and
 * returns an instance of a AddressTor2.
 */
export function deserializeTor2(reader: BufferCursor): AddressTor2 {
    const hostBytes = reader.readBytes(10);
    const port = reader.readUInt16BE();
    const host = torStringFromBuffer(hostBytes);
    return new AddressTor2(host, port);
}
