/**
 * Returns the number of bytes for a VarInt
 * @param val
 */
export function varIntBytes(val: number | BigInt) {
    if (val < 0) throw new Error("Invalid varint");
    if (val < 0xfd) return 1;
    if (val <= 0xffff) return 3;
    if (val <= 0xffffffff) return 5;
    if (val <= 0xffffffffffffffff) return 9;
    throw new Error("Invalid varint");
}
