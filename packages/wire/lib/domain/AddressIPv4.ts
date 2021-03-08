import { Address } from "./Address";
import { AddressType } from "./AddressType";

export class AddressIPv4 extends Address {
    /**
     * Represents an IPv4 address with the host and port.
     */
    constructor(host: string, port: number) {
        super(host, port);
    }

    public get type(): AddressType {
        return AddressType.IPv4;
    }

    public toString() {
        return `${this.host}:${this.port}`;
    }
}
