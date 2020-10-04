import { Base32 } from "@node-lightning/core";

/**
 * Converts a Buffer into a TOR address including the .onion suffix
 */
export function torStringFromBuffer(buffer: Buffer): string {
    return Base32.encode(buffer).toLowerCase() + ".onion";
}
