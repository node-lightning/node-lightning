// @ts-check

import { BufferCursor } from "@lntools/buffer-cursor";
import { Address } from "../../domain/address";
import { AddressType } from "../../domain/address-type";
import { deserializeIPv4 } from "./deserialize-ipv4";
import { deserializeIPv6 } from "./deserialize-ipv6";
import { deserializeTor2 } from "./deserialize-tor2";
import { deserializeTor3 } from "./deserialize-tor3";

/**
 * Deserializes an address based on the type and returns
 * an instance of Address as a polymorphic type.
 */
export function deserializeAddress(type: AddressType, reader: BufferCursor): Address {
  switch (type) {
    case AddressType.IPv4:
      return deserializeIPv4(reader);
    case AddressType.IPv6:
      return deserializeIPv6(reader);
    case AddressType.TOR2:
      return deserializeTor2(reader);
    case AddressType.TOR3:
      return deserializeTor3(reader);
  }
}
