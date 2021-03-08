import { AddressJson } from "./AddressJson";
import { AddressType } from "./AddressType";
import { NetworkType } from "./NetworkType";

export abstract class Address {
    /**
     * String notation representation of the host
     */
    public host: string;

    /**
     * Port number
     */
    public port: number;

    /**
     * Base class representing a network address
     */
    constructor(host: string, port: number) {
        this.host = host;
        this.port = port;
    }

    /**
     * Type of connection
     */
    public get type(): AddressType {
        throw new Error("Not implemented");
    }

    public toString() {
        return `${this.host}:${this.port}`;
    }

    public toJSON(): AddressJson {
        return {
            network: NetworkType.TCP,
            address: this.toString(),
        };
    }
}
