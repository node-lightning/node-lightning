/**
 * Converts an IPv4 address in string notation to the
 * byte representation.
 */
export function ipv4StringToBuffer(host: string): Buffer {
    const parts = host.split(".");
    const result = Buffer.alloc(4);
    for (let i = 0; i < 4; i++) {
        result[i] = parseInt(parts[i]);
    }
    return result;
}
