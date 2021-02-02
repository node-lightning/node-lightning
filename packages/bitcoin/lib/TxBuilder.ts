import { BufferWriter } from "@node-lightning/bufio";
import { hash256, sign, sigToDER } from "@node-lightning/crypto";
import { LockTime } from "./LockTime";
import { OutPoint } from "./OutPoint";
import { Script } from "./Script";
import { Sequence } from "./Sequence";
import { Sorter } from "./Sorter";
import { Tx } from "./Tx";
import { TxIn } from "./TxIn";
import { TxOut } from "./TxOut";
import { Value } from "./Value";

export class TxBuilder {
    public inputSorter: Sorter<TxIn>;
    public outputSorter: Sorter<TxOut>;

    private _version: number;
    private _locktime: LockTime;
    private _inputs: TxIn[];
    private _outputs: TxOut[];

    constructor(inputSorter: Sorter<TxIn> = () => 0, outputSorter: Sorter<TxOut> = () => 0) {
        this._inputs = [];
        this._outputs = [];
        this._version = 2;
        this._locktime = new LockTime();
        this.inputSorter = inputSorter;
        this.outputSorter = outputSorter;
    }

    /**
     * Gets or sets the transaction version. Valid transaction versions
     * are > 1.
     */
    public get version(): number {
        return this._version;
    }

    public set version(val: number) {
        this._version = val;
    }

    /**
     * Gets or sets the absolute locktime for the transaction
     */
    public get locktime(): LockTime {
        return this._locktime;
    }

    public set locktime(val: LockTime) {
        this._locktime = val;
    }

    /**
     * Gets the inputs sorted by the input sorter
     */
    public get inputs(): TxIn[] {
        const inputs = this._inputs.slice();
        inputs.sort(this.inputSorter);
        return inputs;
    }

    /**
     * Gets the outputs sorted by the output sorter
     */
    public get outputs(): TxOut[] {
        const outputs = this._outputs.slice();
        outputs.sort(this.outputSorter);
        return outputs;
    }

    /**
     * Adds a new transaction input
     * @param outpoint the previous output represented as an outpoint
     */
    public addInput(outpoint: string | OutPoint, sequence?: Sequence, scriptSig?: Script) {
        outpoint = outpoint instanceof OutPoint ? outpoint : OutPoint.fromString(outpoint);
        this._inputs.push(new TxIn(outpoint, scriptSig, sequence));
    }

    /**
     * Adds a transaction output
     * @param value value sent to the lock script. When represented as a
     * number, the value is in Bitcoin.
     * @param scriptPubKey the locking script encumbering the funds send
     * to this output
     */
    public addOutput(value: number | Value, scriptPubKey: Script) {
        value = value instanceof Value ? value : Value.fromBitcoin(value);
        this._outputs.push(new TxOut(value, scriptPubKey));
    }

    /**
     * Creates a signature hash including all inputs and all outputs,
     * which is referred to as SIGHASH_ALL. The scriptSig of all inputs
     * is removed (as it is never signed), however we commit to the
     * signatory input using the scriptPubKey from the prevOut or the
     * redeemScript. The hash is constructed as the serialization of
     * all information (with the input scriptSig replaced as just
     * described) and then appending a 4-byte LE sighash type. We then
     * take the hash256 of that serialized transaction.
     *
     * @param input signatory input index
     * @param commitScript the scriptSig used for the signature input
     */
    public hashAll(input: number, commitScript: Script): Buffer {
        const writer = new BufferWriter();

        // write the version
        writer.writeUInt32LE(this.version);

        // sign all inputs as sorted by the sorting function
        const inputs = this.inputs;
        writer.writeVarInt(inputs.length);
        for (let i = 0; i < inputs.length; i++) {
            // blank out scriptSig for non-signatory inputs
            let scriptSig = new Script();

            // use the commit script for signatory input
            if (i === input) {
                scriptSig = commitScript;
            }

            // write the input
            const vin = new TxIn(inputs[i].outpoint, commitScript, inputs[i].sequence);
            writer.writeBytes(vin.serialize());
        }

        // sign all outputs as sorted by the sorting function
        const outputs = this.outputs;
        writer.writeVarInt(outputs.length);
        for (const vout of outputs) {
            writer.writeBytes(vout.serialize());
        }

        // write the sequence
        writer.writeBytes(this.locktime.serialize());

        // write the sighash type 0x01 as 4-bytes little endian
        writer.writeUInt32LE(1);

        // return hashed value
        return hash256(writer.toBuffer());
    }

    /**
     * Signs an input and returns the DER encoded signature. The
     * script that is committed to will depend on the type of the
     * signature. This is usually the locking script used in the prior
     * output, but in the case of p2sh transactions, this is the
     * redeem script, or the underlying script that is hashed in the
     * prior output.
     *
     * @param input index of input that should be signed
     * @param commitScript Script that is committed during signature
     * @param privateKey 32-byte private key
     */
    public sign(input: number, commitScript: Script, privateKey: Buffer): Buffer {
        // create the hash of the transaction for the input
        const hash = this.hashAll(input, commitScript);

        // sign DER encode signature
        const sig = sign(hash, privateKey);
        const der = sigToDER(sig);

        // return signature with 1-byte sighash type
        return Buffer.concat([der, Buffer.from([1])]);
    }

    /**
     * Returns an immutable transaction
     */
    public toTx(): Tx {
        return new Tx(
            this.version,
            this.inputs.map(vin => vin.clone()),
            this.outputs.map(vout => vout.clone()),
            this.locktime.clone(),
        );
    }

    public serialize(): Buffer {
        return this.toTx().serialize();
    }
}
