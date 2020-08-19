import { BufferReader } from "@node-lightning/bufio";
import { SizeResult } from "../SizeResult";
import { isSegWitTx } from "./isSegwitTx";

/**
 * Decodes the size, virtual size, and weight properties from the raw
 * transaction buffer.
 *
 * `size` is the number of raw bytes.
 * `weight` is the number of witness bytes + the number of non-witness
 *   bytes multiplied by four.
 * `vsize` is the weight divided by four.
 */
export function decodeTxSize(raw: Buffer): SizeResult {
    const cursor = new BufferReader(raw);
    const hasWitness = isSegWitTx(raw);

    let nwBytes = 0;
    let wBytes = 0;

    // version
    nwBytes += 4;
    cursor.position += 4;

    // witness flags
    if (hasWitness) {
        wBytes += 2;
        cursor.position += 2;
    }

    // number of inputs
    const vinLen = Number(cursor.readVarUint()); // safe to convert
    nwBytes += cursor.lastReadBytes;

    for (let idx = 0; idx < vinLen; idx++) {
        // prev output hash
        cursor.position += 32;
        nwBytes += 32;

        // prev output index
        cursor.position += 4;
        nwBytes += 4;

        // script sig length
        const scriptSigLen = Number(cursor.readVarUint()); // safe to convert
        nwBytes += cursor.lastReadBytes;

        // script sig
        cursor.position += scriptSigLen;
        nwBytes += scriptSigLen;

        // seqeuence
        cursor.position += 4;
        nwBytes += 4;
    }

    // number of outputs
    const voutLen = Number(cursor.readVarUint()); // safe to convert
    nwBytes += cursor.lastReadBytes;

    // process each output
    for (let idx = 0; idx < voutLen; idx++) {
        // valid in sats
        cursor.position += 8;
        nwBytes += 8;

        // pubkey/redeem script len
        const pubKeyScriptLen = Number(cursor.readVarUint()); // safe to convert
        nwBytes += cursor.lastReadBytes;

        // pubkeyScript/redeemScript
        cursor.position += pubKeyScriptLen;
        nwBytes += pubKeyScriptLen;
    }

    // process witness data
    if (hasWitness) {
        // for each input
        for (let i = 0; i < vinLen; i++) {
            // find how many witness components there are
            const witnessItems = Number(cursor.readVarUint()); // safe to convert
            wBytes += cursor.lastReadBytes;

            // read each witness component
            for (let w = 0; w < witnessItems; w++) {
                // read the item length
                const itemLen = Number(cursor.readVarUint()); // safe to convert
                wBytes += cursor.lastReadBytes;

                // read the item data
                cursor.position += itemLen;
                wBytes += itemLen;
            }
        }
    }

    // locktime
    cursor.position += 4;
    nwBytes += 4;

    // size will be the raw length of bytes
    const size = raw.length;

    // weight is non-witness bytes * 4 + witness bytes
    const weight = nwBytes * 4 + wBytes;

    // virtual size is weight / 4
    // this is equivalent for non-segwit transactions
    const vsize = Math.ceil(weight / 4);

    return {
        size,
        vsize,
        weight,
    };
}
