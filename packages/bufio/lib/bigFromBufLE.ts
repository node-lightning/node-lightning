import { bigFromBufBE } from "./bigFromBufBE";

export function bigFromBufLE(buf: Buffer): bigint {
    return bigFromBufBE(Buffer.from(buf).reverse());
}
