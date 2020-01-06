import { base32 } from "rfc4648";

/**
 * Converts a Buffer into a TOR address including the .onion suffix
 */
export function torStringFromBuffer(buffer: Buffer): string {
  return base32.stringify(buffer).toLowerCase() + ".onion";
}
