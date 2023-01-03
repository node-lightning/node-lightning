import { bigFromBufLE, BufferReader, BufferWriter, StreamReader } from "@node-lightning/bufio";
import { Bits } from "./Bits";
import { BlockHeader } from "./BlockHeader";
import { HashValue } from "./HashValue";
import { Script } from "./Script";
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
        const txBytes = r.readBytes();
        const txsStream = StreamReader.fromBuffer(txBytes);
        const txs: Tx[] = [];
        for (let i = 0; i < numTxs; i++) {
            txs.push(Tx.parse(txsStream, true));
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
     * Complete list of transactions, in the order they were included
     * in the `Block`.
     */
    public txs: Tx[];
    private _bip34Height: bigint;

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

    /**
     * Returns the coinbase transaction which will be the first transaction
     * in the block.
     */
    public get coinbase(): Tx {
        return this.txs[0];
    }

    /**
     * Returns the BIP34 height if one exists. A BIP34 height will exist
     * in block versions > 1. BIP34 encodes the block height LE encoding
     * as the first data in the coinbase's scriptSig.
     */
    public get bip34Height(): bigint | undefined {
        // return undefined when BIP34 is not supported for the block
        if (this.version < 2) return;

        // Return the previously decoded height
        if (this._bip34Height) return this._bip34Height;

        // Decode and return the height
        const scriptGen = Script.readCmds(this.coinbase.inputs[0].scriptSig.buffer);
        const first = scriptGen.next();
        if (first.done) return;

        // convert from buffer
        this._bip34Height = bigFromBufLE(first.value as Buffer);
        return this._bip34Height;
    }
}
