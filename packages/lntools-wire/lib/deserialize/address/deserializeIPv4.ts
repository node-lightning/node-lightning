import { BufferCursor } from "@lntools/buffer-cursor";
import { AddressIPv4 } from "../../domain/AddressIPv4";
import { ipv4StringFromBuffer } from "./ipv4StringFromBuffer";

/**
 * Deserializes an IPv4 address from a BufferCursor and
 * returns an instance of an IPv4 Address.
 */
export function deserializeIPv4(reader: BufferCursor): AddressIPv4 {
    const hostBytes = reader.readBytes(4);
    const port = reader.readUInt16BE();
    const host = ipv4StringFromBuffer(hostBytes);
    return new AddressIPv4(host, port);
}
