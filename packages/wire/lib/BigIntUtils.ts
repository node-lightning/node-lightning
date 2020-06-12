export function calcBytes(num: bigint) {
    let b = 0;
    while (num > BigInt(0)) {
        b += 1;
        num /= BigInt(2 ** 8);
    }
    return b;
}

export function bigintToBuffer(num: bigint): Buffer {
    const bytes = calcBytes(num);
    return Buffer.from(num.toString(16).padStart(bytes * 2, "0"), "hex");
}
