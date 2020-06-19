import { BufferWriter } from "@lntools/buffer-cursor";
import { AddressIPv4 } from "../../domain/AddressIPv4";
import { ipv4StringToBuffer } from "./ipv4StringToBuffer";

/**
 * Serializes an IPv4 address in a Buffer that can be sent
 * over the wire.
 */
export function serializeIPv4(address: AddressIPv4): Buffer {
    const writer = new BufferWriter(Buffer.alloc(7));

    const hostBytes = ipv4StringToBuffer(address.host);

    writer.writeUInt8(address.type);
    writer.writeBytes(hostBytes);
    writer.writeUInt16BE(address.port);

    return writer.toBuffer();
}
