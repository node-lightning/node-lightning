import { Address } from "./address";
import { AddressType } from "./address-type";

export class AddressTor2 extends Address {
  /**
   * Represents an TOR v2 address with the host and port.
   */
  constructor(host: string, port: number) {
    super(host, port);
  }

  get type() {
    return AddressType.TOR2;
  }
}
