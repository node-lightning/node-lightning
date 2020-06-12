/**
 * Converts an IPv4 address into string notation
 * of the format x.x.x.x where each x is an 8-bit integer.
 */
export function ipv4StringFromBuffer(bytes: Buffer): string {
    return bytes.join(".");
}
