export function bigToBufBE(num: bigint, len?: number): Buffer {
    let str = num.toString(16);
    if (len) str = str.padStart(len * 2, "0");
    else if (str.length % 2 === 1) str = "0" + str;
    return Buffer.from(str, "hex");
}
