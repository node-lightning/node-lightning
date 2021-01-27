export function bigFromBufBE(buf: Buffer): bigint {
    return BigInt("0x" + buf.toString("hex"));
}
