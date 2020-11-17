import { BufferWriter, StreamReader } from "@node-lightning/bufio";
import { hash256, sha256 } from "@node-lightning/crypto";
import { write } from "fs";
import { HashValue } from "./HashValue";
import { Script } from "./Script";
import { SizeResult } from "./SizeResult";
import { decodeTx } from "./tx-decoder/decodeTx";
import { decodeTxSize } from "./tx-decoder/decodeTxSize";
import { TxIdResult } from "./TxIdResult";
import { TxIn } from "./TxIn";
import { TxInSequence } from "./TxInSequence";
import { TxLockTime } from "./TxLockTime";
import { TxOut } from "./TxOut";
import { Witness } from "./Witness";

// export type Tx = {
//     txId: Buffer;
//     hash: Buffer;
//     version: number;
//     size: number;
//     vsize: number;
//     weight: number;
//     vin: TxIn[];
//     vout: TxOut[];
//     locktime: number;
// };

// export type TxIn = {
//     txId: Buffer;
//     vout: number;
//     scriptSig?: Buffer;
//     witness?: Buffer[];
//     sequence: number;
// };

// export type TxOut = {
//     value: bigint;
//     pubKeyScript: Buffer;
// };

export class Tx {
    /**
     * Parses a transaction from its byte format in a stream. Capable of
     * parsing both legacy and segwit transactions. Size and ID
     * calculation are performed in a lazy loaded way.
     * @param reader
     */
    public static parse(reader: StreamReader): Tx {
        // read version
        const version = reader.readUInt32LE();

        // check for witness marker and version flag
        const segwitBytes = reader.readBytes(2);
        const hasWitness = segwitBytes[0] === 0x00 && segwitBytes[1] === 0x01;

        // for non-witness data, we unshift the values back
        if (!hasWitness) reader.unshift(segwitBytes);

        // read each input
        const vinLen = Number(reader.readVarInt());
        const inputs: TxIn[] = [];
        for (let idx = 0; idx < vinLen; idx++) {
            inputs.push(
                new TxIn(
                    HashValue.parse(reader),
                    reader.readUInt32LE(),
                    Script.parse(reader),
                    TxInSequence.parse(reader),
                ),
            );
        }

        // read each output
        const voutLen = Number(reader.readVarInt());
        const outputs: TxOut[] = [];
        for (let idx = 0; idx < voutLen; idx++) {
            outputs.push(new TxOut(
                reader.readBigUInt64LE(),
                Script.parse(reader),
            )); // prettier-ignore
        }

        // process witness data
        if (hasWitness) {
            // for each input
            for (let i = 0; i < vinLen; i++) {
                // read number of witness items
                const items = Number(reader.readVarInt());

                // parse each witness item and add it to the input
                for (let item = 0; item < items; item++) {
                    inputs[i].witness.push(Witness.parse(reader));
                }
            }
        }

        // read the locktime
        const locktime = TxLockTime.parse(reader);

        return new Tx(version, inputs, outputs, locktime);
    }

    public get version(): number {
        return this._version;
    }

    public set version(val: number) {
        this._version = val;
    }

    public get txId(): HashValue {
        return this._txId;
    }

    public get hash(): HashValue {
        return this._hash;
    }

    public get inputs(): TxIn[] {
        return this._inputs;
    }

    public set inputs(val: TxIn[]) {
        this._inputs = val;
    }

    public get outputs(): TxOut[] {
        return this._outputs;
    }

    public set outputs(val: TxOut[]) {
        this._outputs = val;
    }

    public get locktime(): TxLockTime {
        return this._locktime;
    }

    public set locktime(val: TxLockTime) {
        this._locktime = val;
    }

    public get isSegWit(): boolean {
        return this._inputs.some(p => p.witness.length > 0);
    }

    public get size(): number {
        return this._sizes.size;
    }

    public get vsize(): number {
        return this._sizes.vsize;
    }

    public get weight(): number {
        return this._sizes.weight;
    }

    private _version: number;
    private _txId: HashValue;
    private _hash: HashValue;
    private _inputs: TxIn[];
    private _outputs: TxOut[];
    private _locktime: TxLockTime;
    private _sizes: SizeResult;

    public constructor(
        version: number = 2,
        inputs: TxIn[] = [],
        outputs: TxOut[] = [],
        locktime: TxLockTime = new TxLockTime(),
        sizes?: SizeResult,
    ) {
        this._version = version;
        this._inputs = inputs;
        this._outputs = outputs;
        this._locktime = locktime;
        this._sizes = sizes;
    }

    /**
     * Serializes legacy or segwit transactions into a Buffer
     */
    public serialize(): Buffer {
        if (this.isSegWit) return this._serializeSegWit();
        else return this._serializeLegacy();
    }

    private _serializeLegacy(): Buffer {
        const writer = new BufferWriter();

        // version
        writer.writeUInt32LE(this.version);

        // inputs
        writer.writeVarInt(this.inputs.length);
        for (const input of this.inputs) {
            writer.writeBytes(input.serialize());
        }

        // outputs
        writer.writeVarInt(this.outputs.length);
        for (const output of this.outputs) {
            writer.writeBytes(output.serialize());
        }

        // locktime
        writer.writeBytes(this.locktime.serialize());

        return writer.toBuffer();
    }

    private _serializeSegWit(): Buffer {
        const writer = new BufferWriter();

        // version
        writer.writeUInt32LE(this.version);

        // write segwit marker and version
        writer.writeBytes(Buffer.from([0x00, 0x01]));

        // inputs
        writer.writeVarInt(this.inputs.length);
        for (const input of this.inputs) {
            writer.writeBytes(input.serialize());
        }

        // outputs
        writer.writeVarInt(this.outputs.length);
        for (const output of this.outputs) {
            writer.writeBytes(output.serialize());
        }

        // witness data
        if (this.isSegWit) {
            for (const input of this.inputs) {
                writer.writeVarInt(input.witness.length);
                for (const witness of input.witness) {
                    writer.writeBytes(witness.serialize());
                }
            }
        }

        // locktime
        writer.writeBytes(this.locktime.serialize());

        return writer.toBuffer();
    }

    /**
     * Decodes the txId and hash from the Buffer.
     *
     * For non-segwit transitions, the hash value is the double-sha256 of
     * version|vins|vouts|locktime. The txid is the reverse of the hash.
     *
     * For segwit transactions, the hash value is returned as the wtxid as
     * calculated by the double-sha256 of
     *  version|0x00|0x01|inputs|outputs|witness|locktime. The txId is
     * calculate the same as legacy transactions by performing a double
     * sha256 hash of the data minus segwit data and markers.
     */
    private _calcTxId(): TxIdResult {
        const txId: Buffer = hash256(this._serializeLegacy()).reverse();
        const hash: Buffer = this.isSegWit
            ? hash256(this._serializeSegWit()).reverse()
            : Buffer.from(txId);
        return {
            txId,
            hash,
        };
    }

    /**
     * Decodes the size, virtual size, and weight properties from the raw
     * transaction buffer.
     *
     * `size` is the number of raw bytes.
     * `weight` is the number of witness bytes + the number of non-witness
     *   bytes multiplied by four.
     * `vsize` is the weight divided by four.
     */
    private _calcSize(raw: Buffer): SizeResult {
        // const cursor = new BufferReader(raw);
        // const hasWitness = isSegWitTx(raw);

        // let nwBytes = 0;
        // let wBytes = 0;

        // // version
        // nwBytes += 4;
        // cursor.position += 4;

        // // witness flags
        // if (hasWitness) {
        //     wBytes += 2;
        //     cursor.position += 2;
        // }

        // // number of inputs
        // const vinLen = Number(cursor.readVarUint()); // safe to convert
        // nwBytes += cursor.lastReadBytes;

        // for (let idx = 0; idx < vinLen; idx++) {
        //     // prev output hash
        //     cursor.position += 32;
        //     nwBytes += 32;

        //     // prev output index
        //     cursor.position += 4;
        //     nwBytes += 4;

        //     // script sig length
        //     const scriptSigLen = Number(cursor.readVarUint()); // safe to convert
        //     nwBytes += cursor.lastReadBytes;

        //     // script sig
        //     cursor.position += scriptSigLen;
        //     nwBytes += scriptSigLen;

        //     // seqeuence
        //     cursor.position += 4;
        //     nwBytes += 4;
        // }

        // // number of outputs
        // const voutLen = Number(cursor.readVarUint()); // safe to convert
        // nwBytes += cursor.lastReadBytes;

        // // process each output
        // for (let idx = 0; idx < voutLen; idx++) {
        //     // valid in sats
        //     cursor.position += 8;
        //     nwBytes += 8;

        //     // pubkey/redeem script len
        //     const pubKeyScriptLen = Number(cursor.readVarUint()); // safe to convert
        //     nwBytes += cursor.lastReadBytes;

        //     // pubkeyScript/redeemScript
        //     cursor.position += pubKeyScriptLen;
        //     nwBytes += pubKeyScriptLen;
        // }

        // // process witness data
        // if (hasWitness) {
        //     // for each input
        //     for (let i = 0; i < vinLen; i++) {
        //         // find how many witness components there are
        //         const witnessItems = Number(cursor.readVarUint()); // safe to convert
        //         wBytes += cursor.lastReadBytes;

        //         // read each witness component
        //         for (let w = 0; w < witnessItems; w++) {
        //             // read the item length
        //             const itemLen = Number(cursor.readVarUint()); // safe to convert
        //             wBytes += cursor.lastReadBytes;

        //             // read the item data
        //             cursor.position += itemLen;
        //             wBytes += itemLen;
        //         }
        //     }
        // }

        // // locktime
        // cursor.position += 4;
        // nwBytes += 4;

        // // size will be the raw length of bytes
        // const size = raw.length;

        // // weight is non-witness bytes * 4 + witness bytes
        // const weight = nwBytes * 4 + wBytes;

        // // virtual size is weight / 4
        // // this is equivalent for non-segwit transactions
        // const vsize = Math.ceil(weight / 4);

        // return {
        //     size,
        //     vsize,
        //     weight,
        // };
        throw new Error("Not implemented");
    }

    private _reset() {
        this._txId = null;
        this._hash = null;
        this._sizes = null;
    }
}
