import { Address } from "./Address";
import { AddressType } from "./AddressType";

export class AddressTor2 extends Address {
    /**
     * Represents an TOR v2 address with the host and port. TOR v2
     * addresses are an 80-bit hash represented as base32 encoding
     * that is 16 characters in length
     */
    constructor(host: string, port: number) {
        super(host, port);
    }

    public get type() {
        return AddressType.TOR2;
    }
}
