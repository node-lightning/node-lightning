import { BufferCursor } from "@lntools/buffer-cursor";
import { AddressIPv6 } from "../../domain/address-ipv6";
import { ipv6StringFromBuffer } from "./ipv6-string-from-buffer";

/**
 * Deserializes an IPv6 address from a BufferCursor and
 * returns an instance of an IPv6 Address.
 */
export function deserializeIPv6(reader: BufferCursor): AddressIPv6 {
  const hostBytes = reader.readBytes(16);
  const port = reader.readUInt16BE();
  const host = ipv6StringFromBuffer(hostBytes);
  return new AddressIPv6(host, port);
}
