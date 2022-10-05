export function uintBytes(num: number): number {
    return Math.ceil(Math.log2(num + 1) / 8);
}
