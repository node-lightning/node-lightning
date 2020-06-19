import { BufferReader } from "@lntools/bufio";
import { Tx } from "../Tx";
import { TxIn } from "../Tx";
import { TxOut } from "../Tx";
import { decodeTxId } from "./decodeTxId";
import { decodeTxSize } from "./decodeTxSize";
import { isSegWitTx } from "./isSegwitTx";

/**
 * Decodes a raw transaction from a buffer into a Tx object.
 * This method will parse both legacy and SegWit transactions.
 *
 * @remarks
 * Refer to: https://en.bitcoin.it/wiki/Protocol_documentation#tx
 *
 * @param raw raw transaction data
 */
export function decodeTx(raw: Buffer): Tx {
    const cursor = new BufferReader(raw);
    const vins: TxIn[] = [];
    const vouts: TxOut[] = [];

    // read version
    const version = cursor.readUInt32LE();

    // check for precesnse of witness marker and version flag
    const hasWitness = isSegWitTx(raw);

    // if we have witness, we need to read off the marker/flag now
    if (hasWitness) {
        cursor.readBytes(2);
    }

    // number of inputs
    const vinLen = Number(cursor.readVarUint()); // safe to convert

    for (let idx = 0; idx < vinLen; idx++) {
        // prev output hash
        const inputHash = cursor.readBytes(32);

        // prev output index
        const vout = cursor.readUInt32LE();

        // script sig length
        const scriptSigLen = Number(cursor.readVarUint()); // safe to convert

        // script sig
        const scriptSig = cursor.readBytes(scriptSigLen);

        // seqeuence
        const sequence = cursor.readUInt32LE();

        // add to inputs
        vins.push({
            scriptSig,
            sequence,
            txId: inputHash.reverse(),
            vout,
        });
    }

    // number of outputs
    const voutLen = Number(cursor.readVarUint()); // safe to convert

    // process each output
    for (let idx = 0; idx < voutLen; idx++) {
        // valid in sats
        const value = cursor.readUInt64LE();

        // pubkey/redeem script len
        const pubKeyScriptLen = Number(cursor.readVarUint()); // safe to convert

        // pubkeyScript/redeemScript
        const pubKeyScript = cursor.readBytes(pubKeyScriptLen);

        // add to outputs
        vouts.push({
            pubKeyScript,
            value,
        });
    }

    // process witness data
    if (hasWitness) {
        // for each input
        for (let i = 0; i < vinLen; i++) {
            // find how many witness components there are
            const witnessItems = Number(cursor.readVarUint()); // safe to convert

            // read each witness component
            vins[i].witness = [];
            for (let w = 0; w < witnessItems; w++) {
                // read the item length
                const itemLen = Number(cursor.readVarUint()); // safe to convert

                // read the item data
                const item = cursor.readBytes(itemLen);

                // add to witness stack
                vins[i].witness.push(item);
            }
        }
    }

    // finally attach the locktime
    const locktime = cursor.readUInt32LE();

    // decode the size
    const { size, vsize, weight } = decodeTxSize(raw);

    // decode the txId and hash
    const { txId, hash } = decodeTxId(raw);

    return {
        hash,
        locktime,
        size,
        txId,
        version,
        vin: vins,
        vout: vouts,
        vsize,
        weight,
    };
}
