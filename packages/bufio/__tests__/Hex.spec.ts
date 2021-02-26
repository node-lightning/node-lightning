import { expect } from "chai";
import { Hex } from "../lib/Hex";

describe("Hex", () => {
    const tests: [any, number | bigint, string][] = [
        [Hex.uint8, 0, "00"],
        [Hex.uint8, 1, "01"],
        [Hex.uint8, 15, "0f"],
        [Hex.uint8, 16, "10"],
        [Hex.uint8, 127, "7f"],
        [Hex.uint8, 128, "80"],
        [Hex.uint8, 255, "ff"],
        [Hex.uint16LE, 0, "0000"],
        [Hex.uint16LE, 1, "0100"],
        [Hex.uint16LE, 15, "0f00"],
        [Hex.uint16LE, 16, "1000"],
        [Hex.uint16LE, 255, "ff00"],
        [Hex.uint16LE, 256, "0001"],
        [Hex.uint16LE, 512, "0002"],
        [Hex.uint16LE, 61440, "00f0"],
        [Hex.uint16LE, 65535, "ffff"],
        [Hex.uint16LE, 255, "ff00"],
        [Hex.uint16LE, 256, "0001"],
        [Hex.uint16LE, 512, "0002"],
        [Hex.uint16LE, 61440, "00f0"],
        [Hex.uint16LE, 65535, "ffff"],
        [Hex.uint16LE, 65535, "ffff"],
        [Hex.uint32LE, 0, "00000000"],
        [Hex.uint32LE, 1, "01000000"],
        [Hex.uint32LE, 255, "ff000000"],
        [Hex.uint32LE, 65535, "ffff0000"],
        [Hex.uint32LE, 16777215, "ffffff00"],
        [Hex.uint32LE, 4294967295, "ffffffff"],
        [Hex.varint, 0, "00"],
        [Hex.varint, 1, "01"],
        [Hex.varint, 0xfc, "fc"],
        [Hex.varint, 0xfd, "fdfd00"],
        [Hex.varint, 0xff, "fdff00"],
        [Hex.varint, 0xffff, "fdffff"],
        [Hex.varint, 0x010000, "fe00000100"],
        [Hex.varint, 0xffffffff, "feffffffff"],
        [Hex.varint, 0x0100000000, "ff0000000001000000"],
        [Hex.varint, 0xffffffffffffffffn, "ffffffffffffffffff"],
    ];

    for (const [fn, number, expected] of tests) {
        it(fn.name + " " + number + " => " + expected, () => {
            expect(fn(number)).to.equal(expected);
        });
    }
});
