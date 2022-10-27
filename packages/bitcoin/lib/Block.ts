import { BufferReader, BufferWriter, StreamReader } from "@node-lightning/bufio";
import { Bits } from "./Bits";
import { BlockHeader } from "./BlockHeader";
import { HashValue } from "./HashValue";
import { Tx } from "./Tx";

/**
 * This class represents a Bitcoin block including fully constructed
 * transactions. It can be used to deserialize a raw transaction receive
 * from a peer or deserialized from HEX.
 *
 * This class extends the `BlockHeader` type since all properties on
 * a `BlockHeader` are part of a `Block`.
 */
export class Block extends BlockHeader {
    /**
     * Parses a Block with full transactions information by first
     * parsing the `BlockHeader` then the transactions.
     * @param buf
     */
    public static fromBuffer(buf: Buffer): Block {
        const r = new BufferReader(buf);

        // parse the header
        const header = BlockHeader.fromBuffer(r.readBytes(BlockHeader.ByteSize));

        // number of transactions
        const numTxs = Number(r.readVarUint());

        // read txs as a stream
        const txsStream = StreamReader.fromBuffer(r.readBytes());
        const txs: Tx[] = [];
        for (let i = 0; i < numTxs; i++) {
            txs.push(Tx.decode(txsStream));
        }

        // return block
        return new Block(
            header.version,
            header.previousBlockHash,
            header.merkleRoot,
            header.timestamp,
            header.bits,
            header.nonce,
            txs,
        );
    }

    /**
     * Complete list of transactions, in the order they weere included
     * in the `Block`.
     */
    public txs: Tx[];

    constructor(
        version: number,
        previousBlockHash: HashValue,
        merkleRoot: HashValue,
        timestamp: number,
        bits: Bits,
        nonce: number,
        txs: Tx[],
    ) {
        super(version, previousBlockHash, merkleRoot, timestamp, bits, nonce);
        this.txs = txs;
    }

    /**
     * Serializes the `Block` into a Buffer by first serializing the
     * `BlockHeader` followed by a `varint` that encodes the number of
     * transactions followed by a sequence of `Tx`.
     */
    public toBuffer(): Buffer {
        const bw = new BufferWriter();

        // serialize the header
        bw.writeBytes(super.toBuffer());

        // serialize tx count
        bw.writeVarInt(this.txs.length);

        // serialize txs
        for (const tx of this.txs) {
            bw.writeBytes(tx.serialize());
        }

        return bw.toBuffer();
    }
}
