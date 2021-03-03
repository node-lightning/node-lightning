import { HashByteOrder } from "./HashByteOrder";
import { TxIn } from "./TxIn";
import { TxOut } from "./TxOut";

/**
 * Compares two transaction inputs and lexicographically sorted in
 * ascending order using the reversed byte order (RPC) of the txids.
 * If the same txids are in both TxIn, then the output index is sorted
 * in ascending order.
 * @param a
 * @param b
 */
export function bip69InputSorter(a: TxIn, b: TxIn): number {
    const txid = a.outpoint.txid.serialize(HashByteOrder.RPC).compare(b.outpoint.txid.serialize());
    if (txid !== 0) return txid;

    if (a.outpoint.outputIndex < b.outpoint.outputIndex) return -1;
    if (a.outpoint.outputIndex > b.outpoint.outputIndex) return 1;
    return 0;
}

/**
 * Sort transaction amounts in ascending order. Then ScriptPubKey values
 * will be sorted in ascending byte order next.
 * @param a
 * @param b
 */
export function bip69OutputSorter(a: TxOut, b: TxOut): number {
    // sort by amount desc first
    const amount = Number(a.value.sats - b.value.sats);
    if (amount !== 0) return amount;

    // then sort by script pub key
    return a.scriptPubKey.serializeCmds().compare(b.scriptPubKey.serializeCmds());
}
