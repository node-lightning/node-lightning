import { Address } from "./Address";
import { AddressType } from "./AddressType";

export class AddressTor3 extends Address {
    /**
     * Represents an Tor v3 address with the host and port. Tor v3
     * addresses are base32 encoded ed25519 public key and are
     * 56-characters in length.
     */
    constructor(host: string, port: number) {
        super(host, port);
    }

    public get type(): AddressType {
        return AddressType.TOR3;
    }
}
