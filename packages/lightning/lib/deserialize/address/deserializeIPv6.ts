import { BufferReader } from "@node-lightning/bufio";
import { AddressIPv6 } from "../../domain/AddressIPv6";
import { ipv6StringFromBuffer } from "./ipv6StringFromBuffer";

/**
 * Deserializes an IPv6 address from a reader and
 * returns an instance of an IPv6 Address.
 */
export function deserializeIPv6(reader: BufferReader): AddressIPv6 {
    const hostBytes = reader.readBytes(16);
    const port = reader.readUInt16BE();
    const host = ipv6StringFromBuffer(hostBytes);
    return new AddressIPv6(host, port);
}
