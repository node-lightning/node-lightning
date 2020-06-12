// tslint:disable-next-line: no-var-requires
import pushdata from "pushdata-bitcoin";
import { OpCode } from "./OpCodes";

/**
 * Compiles the array of chunks into a valid script
 *
 * @remarks
 *
 * Heavily influenced by bitcoinjs-lib:
 * https://github.com/bitcoinjs/bitcoinjs-lib/blob/master/src/script.js#L35
 *
 * @param chunks
 */
export function compileScript(chunks: Buffer | number | any): Buffer {
    const bufferSize = chunks.reduce((accum, chunk) => {
        // data chunk
        if (Buffer.isBuffer(chunk)) {
            if (chunk.length === 1 && asMinimalOP(chunk) !== undefined) {
                return accum + 1;
            }
            return accum + pushdata.encodingLength(chunk.length) + chunk.length;
        }
        // opcode
        return accum + 1;
    }, 0);

    const buffer = Buffer.alloc(bufferSize);
    let offset = 0;

    chunks.forEach(chunk => {
        // data chunk
        if (Buffer.isBuffer(chunk)) {
            const opcode = asMinimalOP(chunk);
            if (opcode !== undefined) {
                buffer.writeUInt8(opcode, offset);
                offset += 1;
                return;
            }

            offset += pushdata.encode(buffer, chunk.length, offset);
            chunk.copy(buffer, offset);
            offset += chunk.length;

            // opcode
        } else {
            buffer.writeUInt8(chunk, offset);
            offset += 1;
        }
    });
    if (offset !== buffer.length) throw new Error("Could not decode chunks");
    return buffer;
}

///////////////////////////////

/**
 * Helper function that converts an opcode buffer into a single
 * numeric opcode that adheres to the BIP62.3 minimal push policy.
 *
 * @remarks
 * Heavily influenced by bitcoinjs-lib:
 * https://github.com/bitcoinjs/bitcoinjs-lib/blob/master/src/script.js#L35
 *
 * @param buffer
 * @returns opcode value
 */
function asMinimalOP(buffer: Buffer) {
    if (buffer.length === 0) return OpCode.OP_0;
    if (buffer.length !== 1) return;
    if (buffer[0] >= 1 && buffer[0] <= 16) return 0x50 + buffer[0];
    if (buffer[0] === 0x81) return OpCode.OP_1NEGATE;
}
