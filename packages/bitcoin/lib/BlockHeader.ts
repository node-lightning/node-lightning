import { BufferReader, BufferWriter } from "@node-lightning/bufio";
import { hash256 } from "@node-lightning/crypto";
import { Bits } from "./Bits";
import { HashByteOrder } from "./HashByteOrder";
import { HashValue } from "./HashValue";

/**
 * This class represents a Bitcoin block header which is a Block less the
 * transaction information.
 */
export class BlockHeader {
    public static ByteSize = 80;

    /**
     * Parses a block header. The previous block and merkle root are
     * transmitted in little-endian format. For example:
     *
     * ```
     * 02000020 - version, 4-byte LE
     * 8ec39428b17323fa0ddec8e887b4a7c53b8c0a0a220cfd000000000000000000 - previous block, 32-bytes, internal order (LE)
     * 5b0750fce0a889502d40508d39576821155e9c9e3f5c3157f961db38fd8b25be - merkle root, 32-bytes, internal order (LE)
     * 1e77a759 - timestamp, 4-byte LE
     * e93c0118 - bits, 4-byte LE
     * a4ffd71d - nonce, 4-byte LE
     * ```
     * @example
     * ```typescript
     * const buffer = Buffer.from("020000208ec39428b17323fa0ddec8e887b4a7\
     * c53b8c0a0a220cfd0000000000000000005b0750fce0a889502d40508d39576821155e9c9e3f5c\
     * 3157f961db38fd8b25be1e77a759e93c0118a4ffd71d"), "hex");
     * const block = await BlockHeader.fromBuffer(buffer);
     * ```
     */
    public static fromBuffer(buf: Buffer): BlockHeader {
        const r = new BufferReader(buf);
        const version = r.readUInt32LE();
        const previousBlockHash = new HashValue(r.readBytes(32));
        const merkleRoot = new HashValue(r.readBytes(32));
        const timestamp = r.readUInt32LE();
        const bits = Bits.fromBuffer(r.readBytes(4));
        const nonce = r.readUInt32LE();
        return new BlockHeader(version, previousBlockHash, merkleRoot, timestamp, bits, nonce);
    }

    /**
     * Version is normally used for signaling which features are
     * available. Bitcoin blocks used sequential versions up through
     * version 4. After this, BIP0009 was used to indicate that
     * additional versioning bits could be used.
     */
    public version: number;

    /**
     * Previous block as a 32-bytes hash value
     */
    public previousBlockHash: HashValue;

    /**
     * Merkle root as 32-bytes hash value. This encodes all ordered
     * transactions in a 32-byte hash.
     */
    public merkleRoot: HashValue;

    /**
     * Unix style timestamp which is the number of seconds elapsed since
     * January 1, 1970. This value will eventually overflow in 2106.
     */
    public timestamp: number;

    /**
     * Bits encodes the proof-of-work necessary in this block. It
     * contains two parts: exponent and coefficient. It is a succinct
     * way to express a really large number and can represent either
     * a positive or negative number.
     */
    public bits: Bits;

    /**
     * Nonce stands for number used only once. It is the number changed
     * by miners when looking for proof-of-work.
     */
    public nonce: number;

    public constructor(
        version: number,
        previousBlockHash: HashValue,
        merkleRoot: HashValue,
        timestamp: number,
        bits: Bits,
        nonce: number,
    ) {
        this.version = version;
        this.previousBlockHash = previousBlockHash;
        this.merkleRoot = merkleRoot;
        this.timestamp = timestamp;
        this.bits = bits;
        this.nonce = nonce;
    }

    /**
     * Serializes the block into a `Buffer` as received over the wire
     * accordingly:
     *
     * version - 4 bytes LE
     * previous block - 32 bytes, internal order (LE)
     * merkle root - 32 bytes, internal order (LE)
     * timestamp - 4 bytes LE
     * bits - 4 bytes LE
     * nonce - 4 bytes LE
     */
    public toBuffer(): Buffer {
        const result = new BufferWriter(Buffer.alloc(4 + 32 + 32 + 4 + 4 + 4)); // 80

        result.writeUInt32LE(this.version);
        result.writeBytes(this.previousBlockHash.serialize(HashByteOrder.Internal));
        result.writeBytes(this.merkleRoot.serialize(HashByteOrder.Internal));
        result.writeUInt32LE(this.timestamp);
        result.writeBytes(this.bits.toBuffer());
        result.writeUInt32LE(this.nonce);

        return result.toBuffer();
    }

    /**
     * Returns the `hash256` of the block header in RPC byte order. This
     * value will have leading zeros and looks like:
     * 0000000000000000007e9e4c586439b0cdbe13b1370bdd9435d76a644d047523
     *
     * Because this value can be directly converted into a hexadecimal
     * number that can be compared to the target, it is considered
     * big-endian.
     */
    public hash(): HashValue {
        return new HashValue(hash256(this.toBuffer()));
    }

    /**
     * Returns true if the block version supports BIP0009. Prior to this
     * BIP, an incremental approach to block version was used
     * culminating with version 4 blocks supporting BIP00065
     * (OP_CHECKLOCKTIMEVERIFY).
     *
     * BIP0009 solves the problem of allowing multiple feature to be
     * signaled on the network at a time. There can be 29 different
     * features signalled at the same time.
     *
     * The top 3-bits of the version are fixed to 001 which indicates
     * that BIP0009 is in use. This enables the range of bits for use
     * [0x20000000...0x3FFFFFFF].
     *
     * The remaining 29 can signal readiness for a soft force. Once 95%
     * of blocks signal readiness in a given 2016 block epoch the
     * feature is activated by the network.
     */
    public isBip9(): boolean {
        return this.version >> 29 === 1;
    }

    /**
     * Checks if a BIP9 feature is enabled by looking at the version and
     * checking if the specified bit is set. Each feature has a block
     * range and bit. This function checks the bit only according to the
     * algorithm:
     *
     * ```typescript
     * (version >> bit && 1) === 1
     * ```
     * @param bit
     * @returns
     */
    public isBip9Feature(bit: number): boolean {
        return this.isBip9() && ((this.version >> bit) & 1) === 1;
    }
}
