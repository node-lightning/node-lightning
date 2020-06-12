// @ts-check

import { BufferCursor } from "@lntools/buffer-cursor";
import { isSegWitTx } from "./is-segwit-tx";

/**
 * Finds the index of the witness data in the raw Buffer.
 * Returns -1 if the transition does not have witness data.
 *
 * @remarks
 * This method will parse the Buffer to obtain the witness
 * data location.
 */
export function indexOfWitness(raw: Buffer): number {
    if (!isSegWitTx(raw)) return -1;

    const cursor = new BufferCursor(raw);
    cursor.position += 4; // version
    cursor.position += 2; // segwit marker and version

    const vinLen = Number(cursor.readVarUint()); // number of inputs
    for (let idx = 0; idx < vinLen; idx++) {
        cursor.position += 32; // prev output hash
        cursor.position += 4; // prev output index

        const scriptSigLen = Number(cursor.readVarUint()); // script sig length
        cursor.position += scriptSigLen; // script sig
        cursor.position += 4; // sequence
    }

    const voutLen = Number(cursor.readVarUint()); // number of outputs
    for (let idx = 0; idx < voutLen; idx++) {
        cursor.position += 8; // sats

        const pubKeyScriptLen = Number(cursor.readVarUint()); // pubkeyscript length
        cursor.position += pubKeyScriptLen; // pubkeyScript/redeemScript
    }
    return cursor.position;
}
