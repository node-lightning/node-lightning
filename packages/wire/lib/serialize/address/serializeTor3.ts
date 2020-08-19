import { BufferWriter } from "@node-lightning/bufio";
import { AddressTor3 } from "../../domain/AddressTor3";
import { torStringToBuffer } from "./torStringToBuffer";

/**
 * Serializes a Tor v3 address in a Buffer that can be sent
 * over the wire.
 */
export function serializeTor3(address: AddressTor3): Buffer {
    const writer = new BufferWriter(Buffer.alloc(38));

    const hostBytes = torStringToBuffer(address.host);

    writer.writeUInt8(address.type);
    writer.writeBytes(hostBytes);
    writer.writeUInt16BE(address.port);

    return writer.toBuffer();
}
