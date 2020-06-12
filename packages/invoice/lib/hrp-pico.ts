/**
 * Returns the pico equivalent of the hrp multiplier as a BN object
 *
 * For instance:
 *   since m (milli) is 0.001 bitcoin, this is the equivalent of
 *   1000000000 or 1e9 pico bitcoin.
 *
 * @param hrpMultiplier
 * @return returns the BN pico bitcoin value
 */
export function hrpToPico(hrpMultiplier: string): bigint {
    if (!hrpMultiplier) return BigInt(1e12);
    switch (hrpMultiplier) {
        case "m":
            return BigInt(1e9);
        case "u":
            return BigInt(1e6);
        case "n":
            return BigInt(1e3);
        case "p":
            return BigInt(1);
        default:
            throw new Error("Invalid multiplier");
    }
}
