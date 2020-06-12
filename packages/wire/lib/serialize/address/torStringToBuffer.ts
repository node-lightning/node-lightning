import { base32 } from "rfc4648";

/**
 * Converts a Tor address in string notation into a Buffer
 */
export function torStringToBuffer(host: string): Buffer {
    host = host.substr(0, host.indexOf("."));
    host = host.toUpperCase();
    return Buffer.from(base32.parse(host));
}
