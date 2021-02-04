import { bigToBufLE } from "@node-lightning/bufio";
import { encodeVarInt } from "@node-lightning/bufio";
import { BufferReader } from "@node-lightning/bufio";
import { StreamReader } from "@node-lightning/bufio";
import { hash160, isDERSig, validPublicKey } from "@node-lightning/crypto";
import { BitcoinError } from "./BitcoinError";
import { BitcoinErrorCode } from "./BitcoinErrorCode";
import { encodeNum } from "./encodeNum";
import { ICloneable } from "./ICloneable";
import { OpCode } from "./OpCodes";
import { ScriptCmd } from "./ScriptCmd";
import { isSigHashTypeValid } from "./SigHashType";

function asssertValidSig(sig: Buffer) {
    const der = sig.slice(0, sig.length - 1);
    const hashtype = sig[sig.length - 1];

    if (!isDERSig(der)) {
        throw new BitcoinError(BitcoinErrorCode.SigEncodingInvalid);
    }

    if (!isSigHashTypeValid(hashtype)) {
        throw new BitcoinError(BitcoinErrorCode.SigHashTypeInvalid, hashtype);
    }
}

function assertValidPubKey(pubkey: Buffer) {
    if (!validPublicKey(pubkey)) {
        throw new BitcoinError(BitcoinErrorCode.PubKeyInvalid);
    }
}

/**
 * Bitcoin Script
 */
export class Script implements ICloneable<Script> {
    /**
     * Creates a standard (though no longer used) pay-to-pubkey
     * scriptPubKey using the provided pubkey.
     *
     * P2PK format:
     *      <pubkey> OP_CHECKSIG
     *
     * @param pubkey 33-byte compressed or 65-byte uncompressed SEC
     * encoded pubkey
     */
    public static p2pkLock(pubkey: Buffer): Script {
        assertValidPubKey(pubkey);
        return new Script(pubkey, OpCode.OP_CHECKSIG);
    }

    /**
     * Creates a standard (though no longer used) pay-to-pubkey
     * scriptSig using the provided signature.
     *
     * P2PK format:
     *      <sig>
     *
     * @param sig DER encoded signature + 1-byte sighash type
     */
    public static p2pkUnlock(sig: Buffer): Script {
        asssertValidSig(sig);
        return new Script(sig);
    }

    /**
     * Creates a standard Pay-to-Public-Key-Hash scriptPubKey by accepting a
     * hash of a public key as input and generating the script in the standard
     * P2PKH script format:
     *   OP_DUP OP_HASH160 <hash160pubkey> OP_EQUALVERIFY OP_CHECKSIG
     *
     * @param value either the 20-byte hash160 of a pubkey or an SEC
     * encoded compressed or uncompressed pubkey
     */
    public static p2pkhLock(value: Buffer): Script {
        // if not a hash160, then it must be a valid pubkey
        if (value.length !== 20) {
            assertValidPubKey(value);
        }

        // either the hash value or a valid pubkey that needs to be hashed
        const hash160PubKey = value.length === 20 ? value : hash160(value);

        return new Script(
            OpCode.OP_DUP,
            OpCode.OP_HASH160,
            hash160PubKey,
            OpCode.OP_EQUALVERIFY,
            OpCode.OP_CHECKSIG,
        );
    }

    /**
     * Creates a standard Pay-to-Public-Key-Hash scriptSig
     * @param sig BIP66 compliant DER encoded signuture + hash byte
     * @param pubkey SEC encoded public key
     */
    public static p2pkhUnlock(sig: Buffer, pubkey: Buffer): Script {
        asssertValidSig(sig);
        assertValidPubKey(pubkey);
        return new Script(sig, pubkey);
    }

    /**
     * Creates a standard Pay-to-MultiSig scriptPubKey by accepting m of n
     * public keys as inputs in the format:
     *   OP_<m> <pubkey1> <pubkey2> <pubkey..m> OP_<n> OP_CHECKMULTISIG
     */
    public static p2msLock(m: number, ...pubkeys: Buffer[]): Script {
        // assert all public keys are valid
        for (const pubkey of pubkeys) {
            assertValidPubKey(pubkey);
        }

        // ensure proper number of keys
        if (m < 1 || m > pubkeys.length || pubkeys.length === 0 || pubkeys.length > 20) {
            throw new BitcoinError(BitcoinErrorCode.MultiSigSetupInvalid);
        }

        return new Script(
            encodeNum(m),
            ...pubkeys,
            encodeNum(pubkeys.length),
            OpCode.OP_CHECKMULTISIG,
        ); // prettier-ignore
    }

    /**
     * Creates a standard Pay-to-MultiSig scripSig using the provided
     * signatures. The signatures must be in the order of the pub keys
     * used in the lock script. This function also correctly adds OP_0
     * as the first element on the stack to ensure the p2ms off-by-one
     * error is correctly accounted for.
     *
     * Each signature must be DER encoded using BIP66 and
     * include a 1-byte sighash type at the end. The builder validates
     * the signatures. As such they will be 10 to 74 bytes.
     *
     * @param pubkeys
     */
    public static p2msUnlock(...sigs: Buffer[]): Script {
        // assert all signatures
        for (const sig of sigs) {
            asssertValidSig(sig);
        }
        return new Script(
            OpCode.OP_0,
            ...sigs
        ); // prettier-ignore
    }

    /**
     * Creates a standard Pay-to-Script-Hash scriptPubKey by accepting a hash of
     * the redeem script as input and generating the P2SH script:
     *   OP_HASH160 <hashScript> OP_EQUAL
     *
     * Accepts the redeem script either as a Script object or as the
     * hash160 of the redeem script. When the hash160 Buffer is provided
     * it will throw if the Buffer is not 20-bytes.
     *
     * @param value can be either the redeem script as a Script type or
     * the hash160 as a 20-byte buffer
     */
    public static p2shLock(value: Script | Buffer): Script {
        const scriptHash160 = value instanceof Script ? value.hash160() : value;

        if (scriptHash160.length !== 20) {
            throw new BitcoinError(BitcoinErrorCode.Hash160Invalid, {
                got: scriptHash160.length,
                expected: 20,
            });
        }

        return new Script(
            OpCode.OP_HASH160,
            scriptHash160,
            OpCode.OP_EQUAL,
        ); // prettier-ignore
    }

    /**
     * Creates a p2sh unlock script for use in a transaction input
     * scriptSig value. The redeem script, which is the preimage of the
     * of the script hash used to lock the p2sh output, must be provided
     * along with any additional data required to unlock the script.
     *
     * @param redeemScript preimage of the script hash
     * @param data script commands will be added as unlock data
     */
    public static p2shUnlock(redeemScript: Script, data: Script): Script;

    /**
     * Creates a p2sh unlock script for use in a transaction input
     * scriptSig value. The redeem script, which is the preimage of the
     * of the script hash used to lock the p2sh output, must be provided
     * along with any additional data required to unlock the script.
     *
     * @param redeemScript preimage of the script hash
     * @param data ScriptCmd data used to unlock the script
     */
    public static p2shUnlock(redeemScript: Script, ...data: ScriptCmd[]): Script;

    public static p2shUnlock(redeemScript: Script, ...data: Script[] | ScriptCmd[]): Script {
        if (data[0] instanceof Script) {
            return new Script(...data[0].cmds, redeemScript.serializeCmds());
        } else {
            return new Script(...(data as ScriptCmd[]), redeemScript.serializeCmds());
        }
    }

    /**
     * Create a standard Pay-to-Witness-PubKey-Hash scriptPubKey by accepting
     * the hash160 of a compressed public key point as input. It is of the
     * format:
     *   OP_0 <hash160_pubkey>
     *
     * @param value either a 20-byte pubkeyhash or a valid pubkey
     */
    public static p2wpkhLock(value: Buffer): Script {
        // if not a hash160, then it must be a valid pubkey
        if (value.length !== 20) {
            assertValidPubKey(value);
        }

        // either the hash value or a valid pubkey that needs to be hashed
        const hash160PubKey = value.length === 20 ? value : hash160(value);

        return new Script(
            OpCode.OP_0,
            hash160PubKey,
        ); // prettier-ignore
    }

    /**
     * Create a standard Pay-to-Witness-Script-Hash scriptPubKey by accepting
     * the sha256 of the witness script as input. It is of the format:
     *   OP_0 <sha256_redeem_script>
     */
    public static p2wshScript(sha256Script: Buffer): Script {
        return new Script(
            OpCode.OP_0,
            sha256Script,
        ); // prettier-ignore
    }

    /**
     * Parses a stream of bytes representing a Script. The stream must start
     * with a Varint length of Script data. The Script data is then parsed into
     * data blocks or op_codes depending on the meaning of the bytes
     * @param stream
     */
    public static parse(reader: StreamReader) {
        // read the length
        const len = reader.readVarInt();

        // read the length of bytes occupied by the script and then pass it
        // through the command parser.
        const buf = reader.readBytes(Number(len));
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
        const br = new BufferReader(buf);

        // commands that were read off the stack
        const cmds: ScriptCmd[] = [];

        // loop until all bytes have been read
        while (!br.eof) {
            // read the current command from the stream
            const op = br.readUInt8();

            // data range between 1-75 bytes is OP_PUSHBYTES_xx and we simple
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
     * Returns true if other script is an exact match of the current script.
     * This requires all data element sto be exact matches and all operations
     * to be exact matches.
     * @param other
     */
    public equals(other: Script): boolean {
        if (this.cmds.length !== other.cmds.length) return false;
        for (let i = 0; i < this.cmds.length; i++) {
            const l = this.cmds[i];
            const r = other.cmds[i];
            if (Buffer.isBuffer(l) && Buffer.isBuffer(r)) {
                if (!l.equals(r)) return false;
            } else {
                if (l !== r) return false;
            }
        }
        return true;
    }

    /**
     * Returns a string with the friendly name of the opcode. For data,
     * it returns the value in hexadecimal format.
     */
    public toString(): string {
        return this.cmds
            .map(cmd => {
                if (Buffer.isBuffer(cmd)) {
                    return cmd.toString("hex");
                } else {
                    return OpCode[cmd as OpCode];
                }
            })
            .join(" ");
    }

    /**
     * Returns a JSON serialization of the Script.
     */
    public toJSON(): any {
        return this.toString();
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
        // first obtain the length of all commands in the script
        const cmdBuf = this.serializeCmds();

        // capture the length of cmd buffer
        const len = encodeVarInt(cmdBuf.length);

        // return combined buffer
        return Buffer.concat([len, cmdBuf]);
    }

    /**
     * Serializes the commands to a buffer. This information is the raw
     * serialization and can be directly parsed with the `parseCmds` method.
     */
    public serializeCmds(): Buffer {
        const results: Buffer[] = [];
        for (const op of this.cmds) {
            // OP_CODES are just an integers and can just be pushed directly onto
            // the byte array after being converted into a single byte buffer
            if (typeof op === "number") {
                const opBuf = Buffer.from([op]);
                results.push(opBuf);
            }

            // elements will be represented as a buffer of information and we will
            // use the length to determine how to encode it
            else if (op instanceof Buffer) {
                // between 1 and 75 bytes are OP_PUSHBYTES_XX
                // there is no op_code for these. We first need to push
                // the length of the buffer array though as the operation
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

    /**
     * Clone via deep copy
     */
    public clone(): Script {
        return new Script(
            ...this.cmds.map(cmd => {
                if (Buffer.isBuffer(cmd)) {
                    return Buffer.from(cmd);
                } else {
                    return cmd;
                }
            }),
        );
    }

    /**
     * Performs a hash160 on the serialized commands. This is useful for
     * turning a script into a P2SH redeem script.
     */
    public hash160(): Buffer {
        return hash160(this.serializeCmds());
    }
}
