/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */

export function assert(cond: boolean, msg: string) {
    if (!cond) throw new Error(msg);
}

export function isUint8Array(name: string, value: Uint8Array, length?: number | number[]) {
    assert(value instanceof Uint8Array, `Expected ${name} to be an Uint8Array`);

    if (length !== undefined) {
        if (Array.isArray(length)) {
            const numbers = length.join(", ");
            const msg = `Expected ${name} to be an Uint8Array with length [${numbers}]`;
            assert(length.includes(value.length), msg);
        } else {
            const msg = `Expected ${name} to be an Uint8Array with length ${length}`;
            assert(value.length === length, msg);
        }
    }
}

export function isCompressed(value: boolean) {
    assert(toTypeString(value) === "Boolean", "Expected compressed to be a Boolean");
}

export function getAssertedOutput(
    output: Uint8Array | ((len: number) => Uint8Array) = len => new Uint8Array(len),
    length: number,
) {
    if (typeof output === "function") output = output(length);
    isUint8Array("output", output, length);
    return output;
}

export function toTypeString(value: any): string {
    return Object.prototype.toString.call(value).slice(8, -1) as string;
}
