import { Address } from "./Address";
import { AddressType } from "./AddressType";

export class AddressIPv6 extends Address {
    /**
     * Represents an IPv6 address with the host and port.
     */
    constructor(host: string, port: number) {
        super(host, port);
    }

    public get type(): AddressType {
        return AddressType.IPv6;
    }

    public toString() {
        return `[${this.host}]:${this.port}`;
    }
}
