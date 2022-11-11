import { BufferWriter } from "@node-lightning/bufio";
import { hash256, sign, sigToDER, validPrivateKey } from "@node-lightning/crypto";
import { BitcoinError, BitcoinErrorCode, Witness } from ".";
import { LockTime } from "./LockTime";
import { OutPoint } from "./OutPoint";
import { PrivateKey } from "./PrivateKey";
import { Script } from "./Script";
import { Sequence } from "./Sequence";
import { Tx } from "./Tx";
import { TxIn } from "./TxIn";
import { TxOut } from "./TxOut";
import { Value } from "./Value";

export class TxBuilder {
    private _version: number;
    private _locktime: LockTime;
    private _inputs: TxIn[];
    private _outputs: TxOut[];
    private _hashPrevOuts: Buffer;
    private _hashSequence: Buffer;
    private _hashOutputs: Buffer;

    constructor() {
        this._inputs = [];
        this._outputs = [];
        this._version = 2;
        this._locktime = new LockTime();
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
     * Gets the inputs
     */
    public get inputs(): TxIn[] {
        return this._inputs;
    }

    /**
     * Gets the outputs
     */
    public get outputs(): TxOut[] {
        return this._outputs;
    }

    /**
     * Adds a new transaction input
     * @param outpoint the previous output represented as an outpoint
     */
    public addInput(outpoint: TxIn | string | OutPoint, sequence?: Sequence): void {
        if (outpoint instanceof TxIn) {
            this._inputs.push(outpoint.clone());
        } else {
            outpoint = outpoint instanceof OutPoint ? outpoint : OutPoint.fromString(outpoint);
            this._inputs.push(new TxIn(outpoint, undefined, sequence));
        }
    }

    /**
     * Adds a transaction output
     * @param value value sent to the lock script. When represented as a
     * number, the value is in Bitcoin.
     * @param scriptPubKey the locking script encumbering the funds send
     * to this output
     */
    public addOutput(value: TxOut | number | Value, scriptPubKey?: Script) {
        if (value instanceof TxOut) {
            this._outputs.push(value.clone());
        } else {
            value = value instanceof Value ? value : Value.fromBitcoin(value);
            this._outputs.push(new TxOut(value, scriptPubKey));
        }
    }

    /**
     * Adds witness data to the input at the specified index.
     * @param index index of the input, zero based
     * @param witness witness data to add
     */
    public addWitness(index: number, witness: Buffer | Witness) {
        if (index < 0 || index >= this._inputs.length) {
            throw new BitcoinError(BitcoinErrorCode.InputIndexOutOfRange, { index });
        }
        this.inputs[index].addWitness(witness);
    }

    /**
     * Sets the scriptSig for a specified input. This is sugar for
     * `txb.inputs[index] = script;`.
     * @param index index of the input
     * @param script scriptSig to set for the input
     */
    public setScriptSig(index: number, script: Script) {
        if (index < 0 || index >= this._inputs.length) {
            throw new BitcoinError(BitcoinErrorCode.InputIndexOutOfRange, { index });
        }
        this.inputs[index].scriptSig = script;
    }

    /**
     * Sets the locktime for the transaction. This is sugar for
     * `txb.locktime = locktime;` but allows for easy setting via a
     * number.
     * @param locktime
     */
    public setLockTime(locktime: number | LockTime) {
        this.locktime = locktime instanceof LockTime ? locktime : new LockTime(locktime);
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
    public hashLegacy(input: number, commitScript: Script): Buffer {
        const writer = new BufferWriter();

        // write the version
        writer.writeUInt32LE(this.version);

        // sign all inputs as sorted by the sorting function
        const inputs = this._inputs;
        writer.writeVarInt(inputs.length);
        for (let i = 0; i < inputs.length; i++) {
            // blank out scriptSig for non-signatory inputs
            let scriptSig = new Script();

            // use the commit script for signatory input
            if (i === input) {
                scriptSig = commitScript;
            }

            // write the input
            const vin = new TxIn(inputs[i].outpoint, scriptSig, inputs[i].sequence);
            writer.writeBytes(vin.serialize());
        }

        // sign all outputs as sorted by the sorting function
        const outputs = this._outputs;
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
     * Creates a signature hash using the new segregated witness digets
     * alorithm defined in BIP143. The current version only supports
     * SIGHASH_ALL and does not account for OP_CODESEPARATOR.
     *
     * This algorithm has side-effects in that it caches hashPrevOut,
     * hashSequence, and hashOutput values used. This means transaction
     * should not change after signing, though the code does not yet
     * enforce this.
     *
     * @param index signatory input index
     * @param commitScript the scriptSig used for the signature input
     * @param value the value of the input. When a number is supplied it
     * is treated as bitcoin via `Value.fromBitcoin`
     */
    public hashSegwitv0(index: number, commitScript: Script, value: number | Value): Buffer {
        const writer = new BufferWriter();

        // Combines the previous outputs for all inputs in the
        // transaction by serializing and hash256 the concated values:
        //   prevtx:  32-byte IBO
        //   prevIdx: 4-byte LE
        if (this._hashPrevOuts === undefined) {
            const hashWriter = new BufferWriter(Buffer.alloc(this._inputs.length * 36));
            for (const input of this._inputs) {
                hashWriter.writeBytes(input.outpoint.serialize());
            }
            this._hashPrevOuts = hash256(hashWriter.toBuffer());
        }

        // Combines the nSequence values for all inputs in the
        // transaction and then hash256 the values
        if (this._hashSequence === undefined) {
            const hashWriter = new BufferWriter(Buffer.alloc(this._inputs.length * 4));
            for (const input of this._inputs) {
                hashWriter.writeBytes(input.sequence.serialize());
            }
            this._hashSequence = hash256(hashWriter.toBuffer());
        }

        // Combines the outputs for the transaction according by
        // concatenating the serialization of the outputs into a single
        // byte array and then hash256 the values.
        if (this._hashOutputs === undefined) {
            const hashWriter = new BufferWriter();
            for (const vout of this._outputs) {
                hashWriter.writeBytes(vout.serialize());
            }
            this._hashOutputs = hash256(hashWriter.toBuffer());
        }

        writer.writeUInt32LE(this.version);
        writer.writeBytes(this._hashPrevOuts);
        writer.writeBytes(this._hashSequence);

        const vin = this._inputs[index];
        writer.writeBytes(vin.outpoint.serialize());
        writer.writeBytes(commitScript.serialize());
        writer.writeUInt64LE((value instanceof Value ? value : Value.fromBitcoin(value)).sats);
        writer.writeBytes(vin.sequence.serialize());

        writer.writeBytes(this._hashOutputs);
        writer.writeBytes(this.locktime.serialize());
        writer.writeUInt32LE(1); // SIGHASH_ALL

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
    public sign(input: number, commitScript: Script, privateKey: PrivateKey | Buffer): Buffer {
        const privateKeyBuffer = Buffer.isBuffer(privateKey) ? privateKey : privateKey.toBuffer();

        // create the hash of the transaction for the input
        const hash = this.hashLegacy(input, commitScript);

        // sign DER encode signature
        const sig = sign(hash, privateKeyBuffer);
        const der = sigToDER(sig);

        // return signature with 1-byte sighash type
        return Buffer.concat([der, Buffer.from([1])]);
    }

    /**
     * Signs an SegWit v0 input and returns the DER encoded signature.
     * The script that is committed to will depend on the type of the
     * input. This is usually the locking script or redeem script.
     *
     * @param input index of input that should be signed
     * @param commitScript Script that is committed during signature
     * @param privateKey 32-byte private key
     * @param value the value of the input. When a number is supplied it
     * is treated as bitcoin via `Value.fromBitcoin`
     */
    public signSegWitv0(
        input: number,
        commitScript: Script,
        privateKey: PrivateKey | Buffer,
        value: number | Value,
    ): Buffer {
        const privateKeyBuffer = Buffer.isBuffer(privateKey) ? privateKey : privateKey.toBuffer();

        // create the hash of the transaction for the input
        const hash = this.hashSegwitv0(input, commitScript, value);

        // sign DER encode signature
        const sig = sign(hash, privateKeyBuffer);
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
            this._inputs.map(vin => vin.clone()),
            this._outputs.map(vout => vout.clone()),
            this.locktime.clone(),
        );
    }

    public serialize(): Buffer {
        return this.toTx().serialize();
    }

    public toHex(pretty: boolean = false): string {
        return this.toTx().toHex(pretty);
    }
}
