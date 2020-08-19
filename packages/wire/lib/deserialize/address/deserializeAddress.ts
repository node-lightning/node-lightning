import { BufferReader } from "@node-lightning/bufio";
import { Address } from "../../domain/Address";
import { AddressType } from "../../domain/AddressType";
import { deserializeIPv4 } from "./deserializeIPv4";
import { deserializeIPv6 } from "./deserializeIPv6";
import { deserializeTor2 } from "./deserializeTor2";
import { deserializeTor3 } from "./deserializeTor3";

/**
 * Deserializes an address based on the type and returns
 * an instance of Address as a polymorphic type.
 */
export function deserializeAddress(type: AddressType, reader: BufferReader): Address {
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
