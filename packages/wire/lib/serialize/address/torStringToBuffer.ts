import { Base32 } from "@node-lightning/core";

/**
 * Converts a Tor address in string notation into a Buffer
 */
export function torStringToBuffer(host: string): Buffer {
    host = host.substr(0, host.indexOf("."));
    host = host.toUpperCase();
    return Base32.decode(host);
}
