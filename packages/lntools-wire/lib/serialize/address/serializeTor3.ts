import { BufferCursor } from "@lntools/buffer-cursor";
import { AddressTor3 } from "../../domain/AddressTor3";
import { torStringToBuffer } from "./torStringToBuffer";

/**
 * Serializes a Tor v3 address in a Buffer that can be sent
 * over the wire.
 */
export function serializeTor3(address: AddressTor3): Buffer {
  const result = Buffer.alloc(38);
  const writer = new BufferCursor(result);

  const hostBytes = torStringToBuffer(address.host);

  writer.writeUInt8(address.type);
  writer.writeBytes(hostBytes);
  writer.writeUInt16BE(address.port);

  return result;
}
