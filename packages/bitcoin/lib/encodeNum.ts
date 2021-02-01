import { OpCode } from "./OpCodes";
import { ScriptCmd } from "./ScriptCmd";

/**
 * Minimally encodes a number into the appropriate numeric opcode or
 * into a buffer in signed-magnitude representation to avoid collisions
 * other OpCode enum values.
 * @param num
 */
export function encodeNum(input: number | bigint): ScriptCmd {
    const num = BigInt(input);

    // use OP_0 when 0
    if (num === 0n) {
        return OpCode.OP_0;
    }

    // use OP_1 to OP_16 when one of these
    if (num >= 1 && num <= 16) {
        return 0x50 + Number(num);
    }

    const bytes = [];
    const neg = num < 0;
    let abs = num > 0 ? num : -num;

    // push each byte starting with the smallest
    while (abs > 0) {
        bytes.push(Number(abs & BigInt(0xff))); // push on smallest byte
        abs >>= 8n; // shift off smallest byte
    }

    // check if the last byte has the 0x80 bit set if so, then we either push
    // a 0 or 0x80 if it is postive or negative
    if (bytes[bytes.length - 1] & 0x80) {
        if (neg) {
            bytes.push(0x80);
        } else {
            bytes.push(0x00);
        }
    }

    // if the number is negative we set the 0x80 bit for the number to indicate
    // it is negative
    else {
        if (neg) {
            bytes[bytes.length - 1] |= 0x80;
        }
    }

    // return a buffer of the number
    return Buffer.from(bytes);
}
