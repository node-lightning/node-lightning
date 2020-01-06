import { BufferCursor } from "@lntools/buffer-cursor";
import { AddressTor2 } from "../../domain/address-tor2";
import { torStringToBuffer } from "./tor-string-to-buffer";

/**
 * Serializes a Tor v2 address in a Buffer that can be sent
 * over the wire.
 */
export function serializeTor2(address: AddressTor2): Buffer {
  const result = Buffer.alloc(13);
  const writer = new BufferCursor(result);

  const hostBytes = torStringToBuffer(address.host);

  writer.writeUInt8(address.type);
  writer.writeBytes(hostBytes);
  writer.writeUInt16BE(address.port);

  return result;
}
