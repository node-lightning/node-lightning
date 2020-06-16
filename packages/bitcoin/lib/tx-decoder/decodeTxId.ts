import { sha256 } from "@lntools/crypto";
import { TxIdResult } from "../txid-result";
import { indexOfWitness } from "./indexOfWitness";
import { isSegWitTx } from "./isSegwitTx";

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
export function decodeTxId(raw: Buffer): TxIdResult {
    let hash: Buffer;
    let txId: Buffer;
    if (isSegWitTx(raw)) {
        const witnessIdx = indexOfWitness(raw);
        const lhash = Buffer.alloc(raw.length - 2 - (raw.length - witnessIdx - 4));
        raw.copy(lhash, 0, 0, 4); // copy the version (2 bytes)
        raw.copy(lhash, 4, 6, witnessIdx); // copy inputs/outputs
        raw.copy(lhash, lhash.length - 4, raw.length - 4); // copy the locktime (4 bytes)

        const txidHash = sha256(sha256(lhash));
        txId = Buffer.alloc(txidHash.length, txidHash).reverse();
        hash = sha256(sha256(raw)).reverse();
    } else {
        const rawhash = sha256(sha256(raw));
        txId = Buffer.alloc(rawhash.length, rawhash).reverse();
        hash = Buffer.alloc(rawhash.length, rawhash).reverse();
    }
    return {
        hash,
        txId,
    };
}
