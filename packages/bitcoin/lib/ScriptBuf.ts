import { encodeVarInt } from "@node-lightning/bufio";
import { StreamReader } from "@node-lightning/bufio";
import { hash160, sha256 } from "@node-lightning/crypto";
import { Address } from "./Address";
import { ICloneable } from "./ICloneable";
import { Network } from "./Network";
import { Script } from "./Script";
import { ScriptCmd } from "./ScriptCmd";

/**
 * Bitcoin Script buffer.
 */
export class ScriptBuf implements ICloneable<ScriptBuf> {
    /**
     * Constructs a ScriptBuf from a Script or array of ScriptCmd objects.
     * @param script
     */
    public static fromScript(script: Script | ScriptCmd[]) {
        if (script instanceof Script) {
            return new ScriptBuf(script.serializeCmds());
        } else {
            return new ScriptBuf(new Script(...script).serializeCmds());
        }
    }

    /**
     * Parses a stream of bytes representing a Script buffer. The stream
     * must start with a varint length of Script data.
     * @param stream
     */
    public static parse(reader: StreamReader) {
        // read the length
        const len = reader.readVarInt();

        // read the length of bytes occupied by the script and then pass it
        // through the command parser.
        const buf = reader.readBytes(Number(len));

        return new ScriptBuf(buf);
    }

    constructor(readonly buffer: Buffer = Buffer.alloc(0)) {}

    /**
     * Returns true if other script buffer is an exact match of the script
     * @param other
     */
    public equals(other: ScriptBuf): boolean {
        return this.buffer.equals(other.buffer);
    }

    /**
     * Returns a hex encoded string of the Script buffer.
     */
    public toString(): string {
        return this.toHex();
    }

    /**
     * Returns the hex encoded string of the Script buffer.
     * @returns
     */
    public toHex(): string {
        return this.buffer.toString("hex");
    }

    /**
     * Returns a JSON serialization of the Script.
     */
    public toJSON() {
        return this.toString();
    }

    /**
     * Returns the parsed script commands.
     */
    public toScript(): Script {
        return Script.fromBuffer(this.buffer);
    }

    /**
     * Serializes the Script to a Buffer by serializing the cmds prefixed with
     * the overall length as a varint. Therefore the format of this method is
     * the format used when encoding a Script and is:
     *
     * [varint]: length
     * [length]: script_cmds
     */
    public serialize(): Buffer {
        // capture the length of cmd buffer
        const len = encodeVarInt(this.buffer.length);

        // return combined buffer
        return Buffer.concat([len, this.buffer]);
    }

    /**
     * Performs a hash160 on the script buffer. This is useful for
     * turning a script into a P2SH redeem script.
     */
    public hash160(): Buffer {
        return hash160(this.buffer);
    }

    /**
     * Performs a sha256 hash on the script buffer. This is useful
     * fro turning a script into a P2WSH lock script.
     */
    public sha256(): Buffer {
        return sha256(this.buffer);
    }

    /**
     * Clones the ScriptBuf type
     */
    public clone(): ScriptBuf {
        return new ScriptBuf(Buffer.from(this.buffer));
    }

    /**
     * Constructs a P2SH address from the script. The address is base58
     * encoded and use the network p2sh prefix plus the hash160 of the
     * script.
     * @param network
     * @returns
     */
    public toP2shAddress(network: Network): string {
        return Address.encodeBase58(network.p2shPrefix, this.hash160());
    }

    /**
     * Constructs a P2WSH address from the script. The address is a
     * bech32 encoded and uses the network p2wsh human readable part
     * plus the sha256 of the script.
     * @param network
     * @returns
     */
    public toP2wshAddress(network: Network): string {
        return Address.encodeBech32(network.p2wshPrefix, 0x00, this.sha256());
    }
}
