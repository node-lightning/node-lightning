import { BufferWriter, StreamReader, varIntBytes } from "@node-lightning/bufio";
import { Hex } from "@node-lightning/bufio";
import { hash256 } from "@node-lightning/crypto";
import { HashByteOrder } from "./HashByteOrder";
import { HashValue } from "./HashValue";
import { LockTime } from "./LockTime";
import { OutPoint } from "./OutPoint";
import { Script } from "./Script";
import { Sequence } from "./Sequence";
import { SizeResult } from "./SizeResult";
import { TxIn } from "./TxIn";
import { TxOut } from "./TxOut";
import { Value } from "./Value";
import { Witness } from "./Witness";

/**
 * This class is an immutable Bitcoin transaction. This class is used
 * as a data container from parsed blocks, RPC, or other sources. To use
 * a mutable transaction, you should use `TxBuilder` class.
 */
export class Tx {
    /**
     * Parses a transaction from its byte format in a stream. Capable of
     * parsing both legacy and segwit transactions. Size and ID
     * are calculated lazily.
     * @param reader
     */
    public static parse(reader: StreamReader): Tx {
        // read version
        const version = reader.readUInt32LE();

        // save bytes for later and unshift values back
        const bytes = reader.readBytes();
        reader.unshift(bytes);

        // check for witness marker and version flag
        const segwitBytes = reader.readBytes(2);
        let hasWitness = segwitBytes[0] === 0x00 && segwitBytes[1] === 0x01;

        // for non-witness data, we unshift the values back
        if (!hasWitness) reader.unshift(segwitBytes);

        let vinLen: number;
        let inputs: TxIn[];
        let outputs: TxOut[];
        let parsedInputs: { vinLen: number; inputs: TxIn[] };
        let parsedOutputs: { voutLen: number; outputs: TxOut[] };
        try {
            parsedInputs = this.parseInputs(reader);
            parsedOutputs = this.parseOutputs(reader);
        } catch (e) {
            // this throw/catch is _still_ necessary for the case where we have unsigned base transactions
            // with zero inputs and 1 output which is serialized as "0001" at bytes 4 and 5.
            // these transactions will not have a script witness associated with them making them invalid
            // witness transactions (you need to have a witness to be considered a witness tx)
            // see: https://github.com/bitcoin-s/bitcoin-s/blob/01d89df1b7c6bc4b1594406d54d5e6019705c654/core-test/src/test/scala/org/bitcoins/core/protocol/transaction/TransactionTest.scala#L88
            hasWitness = false;
            reader.unshift(bytes);
            parsedInputs = this.parseInputs(reader);
            parsedOutputs = this.parseOutputs(reader);
        }

        if (parsedInputs) {
            vinLen = parsedInputs.vinLen;
            inputs = parsedInputs.inputs;
        }
        if (parsedOutputs) {
            outputs = parsedOutputs.outputs;
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

        const locktime = LockTime.parse(reader);

        return new Tx(version, inputs, outputs, locktime);
    }

    private static parseInputs(reader: StreamReader): { vinLen: number; inputs: TxIn[] } {
        // read each input
        const vinLen = Number(reader.readVarInt());
        const inputs: TxIn[] = [];
        for (let idx = 0; idx < vinLen; idx++) {
            inputs.push(
                new TxIn(OutPoint.parse(reader), Script.parse(reader), Sequence.parse(reader)),
            );
        }

        return { vinLen, inputs };
    }

    private static parseOutputs(reader: StreamReader): { voutLen: number; outputs: TxOut[] } {
        // read each output
        const voutLen = Number(reader.readVarInt());
        const outputs: TxOut[] = [];
        for (let idx = 0; idx < voutLen; idx++) {
            outputs.push(new TxOut(
                Value.fromSats(reader.readBigUInt64LE()),
                Script.parse(reader),
            )); // prettier-ignore
        }

        return { voutLen, outputs };
    }

    /**
     * Parses a transaction from a buffer that contains the fully
     * serialization transaction bytes.
     * @param buf
     */
    public static fromBuffer(buf: Buffer): Tx {
        return Tx.parse(StreamReader.fromBuffer(buf));
    }

    /**
     * Parses a transaction from a hex string containing the fully
     * serialized transaction bytes.
     * @param hex
     */
    public static fromHex(hex: string): Tx {
        return Tx.parse(StreamReader.fromHex(hex));
    }

    /**
     * Get the transaction version. The transaction version corresponds
     * to features that are enabled for the transaction such as time
     * locks.
     */
    public get version(): number {
        return this._version;
    }

    /**
     * Gets the transaction identifier. The `txId` for both legacy and
     * segwit transaction is the hash256 of
     * `hash256(version||inputs||ouputs||locktime)`.
     */
    public get txId(): HashValue {
        if (!this._txId) this._lazyCalc();
        return this._txId;
    }

    /**
     * Gets the transaction segwit transaction identifier. For legacy
     * transaction this is the same as the `txId` property. For segwit
     * transaction this is the hash256 of
     * `hash256(version||0x0001||inputs||outputs||witness||locktime)`.
     *
     * This is the same value as the `hash` property in bitcoind RPC
     * results.
     */
    public get witnessTxId(): HashValue {
        if (!this._wtxid) this._lazyCalc();
        return this._wtxid;
    }

    /**
     * Gets the transaction inputs.
     */
    public get inputs(): TxIn[] {
        return this._inputs;
    }

    /**
     * Gets the transaction outputs
     */
    public get outputs(): TxOut[] {
        return this._outputs;
    }

    /**
     * Gets the transaction `nLocktime` value that is used to control
     * absolute timelocks.
     */
    public get locktime(): LockTime {
        return this._locktime;
    }

    public get isSegWit(): boolean {
        return this._inputs.some(p => p.witness.length > 0);
    }

    public get size(): number {
        if (!this._sizes) this._lazyCalc();
        return this._sizes.size;
    }

    public get vsize(): number {
        if (!this._sizes) this._lazyCalc();
        return this._sizes.vsize;
    }

    public get weight(): number {
        if (!this._sizes) this._lazyCalc();
        return this._sizes.weight;
    }

    private _version: number;
    private _txId: HashValue;
    private _wtxid: HashValue;
    private _inputs: TxIn[];
    private _outputs: TxOut[];
    private _locktime: LockTime;
    private _sizes: SizeResult;

    public constructor(
        version: number = 2,
        inputs: TxIn[] = [],
        outputs: TxOut[] = [],
        locktime: LockTime = new LockTime(),
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

    public toJSON() {
        return {
            version: this.version,
            inputs: this.inputs.map(vin => vin.toJSON()),
            outputs: this.outputs.map(vout => vout.toJSON()),
            locktime: this.locktime.toJSON(),
        };
    }

    public toHex(pretty: boolean = false) {
        if (!pretty) return this.serialize().toString("hex");
        else return this._prettyHex();
    }

    private _prettyHex(): string {
        const nl = "\n";
        const pad = "    ";
        let s = "";
        s += Hex.uint32LE(this.version) + nl;
        if (this.isSegWit) {
            s += "0001" + nl;
        }
        s += Hex.varint(this.inputs.length) + nl;
        for (const vin of this.inputs) {
            s += pad + vin.outpoint.txid.serialize(HashByteOrder.Internal).toString("hex") + nl;
            s += pad + Hex.uint32LE(vin.outpoint.outputIndex) + nl;
            s += pad + vin.scriptSig.serialize().toString("hex") + nl;
            s += pad + Hex.uint32LE(vin.sequence.value) + nl;
        }
        s += Hex.varint(this.outputs.length) + nl;
        for (const vout of this.outputs) {
            s += pad + Hex.uint64LE(vout.value.sats) + nl;
            s += pad + vout.scriptPubKey.serialize().toString("hex");
            s += nl;
        }
        if (this.isSegWit) {
            for (const vin of this.inputs) {
                s += Hex.varint(vin.witness.length) + nl;
                for (const w of vin.witness) {
                    s += pad + w.serialize().toString("hex") + nl;
                }
            }
        }
        s += Hex.uint32LE(this.locktime.value);
        return s;
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
    private _calcTxId(): { txId: HashValue; hash: HashValue } {
        const txId: Buffer = hash256(this._serializeLegacy());
        const hash: Buffer = this.isSegWit
            ? hash256(this._serializeSegWit())
            : Buffer.from(txId); // prettier-ignore
        return {
            txId: new HashValue(txId),
            hash: new HashValue(hash),
        };
    }

    /**
     * Calculates the size, virtual size, and weight properties from the
     * based on the current inputs and outputs.
     *
     * `size` is the number of raw bytes.
     * `weight` is the number of witness bytes + the number of non-witness
     *   bytes multiplied by four.
     * `vsize` is the weight divided by four.
     */
    private _calcSize(): SizeResult {
        const hasWitness = this.isSegWit;

        let standardBytes = 0;
        let witnessBytes = 0;

        // version is 4-bytes
        standardBytes += 4;

        // witness flags are 2 bytes
        if (hasWitness) {
            witnessBytes += 2;
        }

        // number of inputs
        standardBytes += varIntBytes(this.inputs.length);

        // add each input
        for (const input of this.inputs) {
            // prev out hash
            standardBytes += 32;

            // prev out index
            standardBytes += 4;

            // scriptSig length
            const scriptSig = input.scriptSig.serializeCmds();
            standardBytes += varIntBytes(scriptSig.length);
            standardBytes += scriptSig.length;

            // sequence, 4-bytes
            standardBytes += 4;

            // input witness
            if (hasWitness) {
                // number of witness
                witnessBytes += varIntBytes(input.witness.length);

                // for each witness
                for (const witness of input.witness) {
                    witnessBytes += varIntBytes(witness.data.length);
                    witnessBytes += witness.data.length;
                }
            }
        }

        // number of outputs
        standardBytes += varIntBytes(this.outputs.length);

        // add each output
        for (const output of this.outputs) {
            // value
            standardBytes += 8;

            // scriptPubKey length
            const scriptPubKey = output.scriptPubKey.serializeCmds();
            standardBytes += varIntBytes(scriptPubKey.length);
            standardBytes += scriptPubKey.length;
        }

        // locktime
        standardBytes += 4;

        // size will be the raw length of bytes
        const size = standardBytes + witnessBytes;

        // weight is non-witness bytes * 4 + witness bytes
        const weight = standardBytes * 4 + witnessBytes;

        // virtual size is weight / 4
        // this is equivalent for non-segwit transactions
        const vsize = Math.ceil(weight / 4);

        return {
            size,
            vsize,
            weight,
        };
    }

    private _lazyCalc() {
        this._sizes = this._calcSize();
        const ids = this._calcTxId();
        this._txId = ids.txId;
        this._wtxid = ids.hash;
    }
}
