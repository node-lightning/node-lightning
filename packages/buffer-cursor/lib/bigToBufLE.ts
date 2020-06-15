import { bigToBufBE } from "./bigToBufBE";

export function bigToBufLE(num: bigint, len?: number): Buffer {
    return bigToBufBE(num, len).reverse();
}
