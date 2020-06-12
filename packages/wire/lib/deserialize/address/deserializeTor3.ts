import { BufferCursor } from "@lntools/buffer-cursor";
import { AddressTor3 } from "../../domain/AddressTor3";
import { torStringFromBuffer } from "./torStringFromBuffer";

/**
 * Deserializes a TOR v3 address from a BufferCursor and
 * returns an instance of a AddressTor2.
 */
export function deserializeTor3(reader: BufferCursor): AddressTor3 {
    const hostBytes = reader.readBytes(35);
    const port = reader.readUInt16BE();
    const host = torStringFromBuffer(hostBytes);
    return new AddressTor3(host, port);
}
