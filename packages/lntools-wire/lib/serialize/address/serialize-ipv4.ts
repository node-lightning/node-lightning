import { BufferCursor } from "@lntools/buffer-cursor";
import { AddressIPv4 } from "../../domain/address-ipv4";
import { ipv4StringToBuffer } from "./ipv4-string-to-buffer";

/**
 * Serializes an IPv4 address in a Buffer that can be sent
 * over the wire.
 */
export function serializeIPv4(address: AddressIPv4): Buffer {
  const result = Buffer.alloc(7); // 8 bytes total
  const writer = new BufferCursor(result);

  const hostBytes = ipv4StringToBuffer(address.host);

  writer.writeUInt8(address.type);
  writer.writeBytes(hostBytes);
  writer.writeUInt16BE(address.port);

  return result;
}
