import { bigToBufLE } from "@lntools/buffer-cursor";
import { encodeVarInt } from "@lntools/buffer-cursor";
import { BufferCursor } from "@lntools/buffer-cursor";
import { StreamReader } from "@lntools/buffer-cursor";
import { Readable } from "stream";
import { OpCode } from "./script/OpCodes";
import { ScriptCmd } from "./ScriptCmd";

/**
 * BitcoinScrpt
 */
export class Script {
    /**
     * Parses a stream of bytes representing a Script. The stream must start
     * with a Varint length of Script data. The Script data is then parsed into
     * data blocks or op_codes depending on the meaning of the bytes
     * @param stream
     */
    public static parse(stream: Readable) {
        const sr = new StreamReader(stream);

        // read the length
        const len = sr.readVarInt();

        // read the length of bytes occupied by the script and then pass it
        // through the command parser.
        const buf = sr.readBytes(Number(len));
        const cmds = Script.parseCmds(buf);

        // return the script object with the commands
        return new Script(...cmds);
    }

    /**
     * When supplied with a Buffer of cmds this method will parse the commands
     * into data blocks or op_codes depending on the meaning of the bytes
     * @param buf
     */
    public static parseCmds(buf: Buffer): ScriptCmd[] {
        const br = new BufferCursor(buf);

        // commands that were read off the stack
        const cmds: ScriptCmd[] = [];

        // loop until all bytes have been read
        while (!br.eof) {
            // read the current command from the stream
            const op = br.readUInt8();

            // data range between 1-75 bytes is OP_PUSHBYTESxx and we simple
            // read the xx number of bytes off the script
            if (op >= 0x01 && op <= 0x4b) {
                const n = op;
                const bytes = br.readBytes(n);
                cmds.push(bytes);
            }

            // data range between 76 and 255 bytes uses OP_PUSHDATA1 and uses
            // the format with a single byte length and then the n bytes are
            // read from the script
            else if (op === OpCode.OP_PUSHDATA1) {
                const n = br.readUInt8();
                cmds.push(br.readBytes(n));
            }

            // data range between 256 and 520 uses OP_PUSHDATA2 and uses the
            // format with two bytes little-endian to determine the n bytes of
            // data of data that need to be read.
            else if (op === OpCode.OP_PUSHDATA2) {
                const n = br.readUInt16LE();
                cmds.push(br.readBytes(n));
            }

            // otherwise the value is an opcode that should be added to the cmds
            else {
                cmds.push(op);
            }
        }

        return cmds;
    }

    /**
     * Commands belonging to the script
     */
    public readonly cmds: ScriptCmd[];

    /**
     * Constructs a Script with the supplied ScriptCmd values
     * @param cmds
     */
    constructor(...cmds: ScriptCmd[]) {
        this.cmds = cmds;
    }

    /**
     * Serializes the Script to a Buffer by serializing the cmds prefixed with
     * the overall length as a varint. Therefore the format of this method is
     * the format used when encoding a Script and is:
     *
     * [varint]: length
     * [length]: script_cmds
     */
    public toBuffer(): Buffer {
        // first obtain the length of all commands in the script
        const cmdBuf = this.toCmdBuffer();

        // capture the length of cmd buffer
        const len = encodeVarInt(cmdBuf.length);

        // return combined buffer
        return Buffer.concat([len, cmdBuf]);
    }

    /**
     * Serializes the commands to a buffer. This information is the raw
     * serialization and can be directly parsed with the `parseCmds` method.
     */
    public toCmdBuffer(): Buffer {
        const results: Buffer[] = [];
        for (const op of this.cmds) {
            // OP_CODES are just an integers and can just be pushed directly onto
            // the byte array after being converted into a single byte byffer
            if (typeof op === "number") {
                const opBuf = Buffer.from([op]);
                results.push(opBuf);
            }

            // elements will be represented as a buffer of information and we will
            // use the length to determine how to encode it
            else if (op instanceof Buffer) {
                // between 1 and 75 bytes are OP_PUSHBYTES_XX
                // there is no op_code for these. We first need to push
                // the length of the buffer arrray though as the operation
                if (op.length >= 1 && op.length <= 75) {
                    results.push(Buffer.from([op.length]));
                    results.push(op);
                }

                // between 76 and 255 uses OP_PUSHDATA1
                // this requires us to push the op_code, a single byte length
                // and finally push the 76-255 bytes of data
                else if (op.length >= 76 && op.length <= 255) {
                    results.push(Buffer.from([OpCode.OP_PUSHDATA1])); // op_pushdata1
                    results.push(Buffer.from([op.length])); // single-byte
                    results.push(op);
                }

                // between 256 and 520 uses OP_PUSHDATA2
                // this requires us to push the op_code, a two-byte little-endian number
                // and finally push the 256-520 bytes of data
                else if (op.length >= 256 && op.length <= 520) {
                    results.push(Buffer.from([OpCode.OP_PUSHDATA2])); // op_pushdata2
                    results.push(bigToBufLE(BigInt(op.length), 2)); // two-bytes little-endian
                    results.push(op);
                }

                // data longer than 520 is not supported
                else {
                    throw new Error("Data too long");
                }
            }
        }

        // combine all parts of data
        return Buffer.concat(results);
    }
}
