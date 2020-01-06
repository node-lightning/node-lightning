import { Address } from "../../domain/address";
import { AddressType } from "../../domain/address-type";

import { serializeIPv4 } from "./serialize-ipv4";
import { serializeIPv6 } from "./serialize-ipv6";
import { serializeTor2 } from "./serialize-tor2";
import { serializeTor3 } from "./serialize-tor3";

/**
 * Serializes an address into a Buffer that can be transmitted
 * over the wire
 */
export function serializeAddress(address: Address): Buffer {
  switch (address.type) {
    case AddressType.IPv4:
      return serializeIPv4(address);
    case AddressType.IPv6:
      return serializeIPv6(address);
    case AddressType.TOR2:
      return serializeTor2(address);
    case AddressType.TOR3:
      return serializeTor3(address);
  }
}
