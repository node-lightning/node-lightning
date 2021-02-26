import { encodeVarInt } from "./encodeVarInt";

export class Hex {
    public static hexAlphabet = [
        "0",
        "1",
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "a",
        "b",
        "c",
        "d",
        "e",
        "f",
    ];

    public static bigToHex(num: bigint, bytes: number, le: boolean = true): string {
        let result = "";
        const bytemask = 0b11111111n;
        const hquartet = 0b11110000;
        const lquartet = 0b1111;
        while (bytes) {
            const byte = Number(num & bytemask);
            const hex = Hex.hexAlphabet[(byte & hquartet) >> 4] + Hex.hexAlphabet[byte & lquartet];
            num >>= 8n;
            bytes -= 1;

            if (le) result += hex;
            else result = hex + result;
        }
        return result;
    }

    public static uint8(value: number | bigint): string {
        return Hex.bigToHex(BigInt(value), 1, true);
    }

    public static uint16LE(value: number | bigint): string {
        return Hex.bigToHex(BigInt(value), 2, true);
    }

    public static uint32LE(value: number | bigint): string {
        return Hex.bigToHex(BigInt(value), 4, true);
    }

    public static uint64LE(value: number | bigint): string {
        return Hex.bigToHex(BigInt(value), 8, true);
    }

    public static varint(value: number | bigint): string {
        return encodeVarInt(value).toString("hex");
    }

    public static buffer(buf: Buffer): string {
        return buf.toString("hex");
    }
}
