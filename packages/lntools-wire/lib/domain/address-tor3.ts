import { Address } from "./address";
import { AddressType } from "./address-type";

export class AddressTor3 extends Address {
  /**
   * Represents an Tor v3 address with the host and port.
   */
  constructor(host: string, port: number) {
    super(host, port);
  }

  get type(): AddressType {
    return AddressType.TOR3;
  }
}
