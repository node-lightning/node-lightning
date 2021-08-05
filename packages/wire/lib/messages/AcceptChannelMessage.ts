import { BufferReader, BufferWriter } from "@node-lightning/bufio";
import { MessageType } from "../MessageType";
import { readTlvs } from "../serialize/readTlvs";
import { IWireMessage } from "./IWireMessage";
import { Value } from "@node-lightning/core";

/**
 * AcceptChannelMessage represents the accept_channel message defined in
 * BOLT #2 of the Lightning Specification. This message is sent by the
 * receiving node in reply to an open_channel message. This message
 * signals agreement to open a channel with the using the values both
 * message. After this message is received by the initiating peer, the
 * initiating peer will create a funding transaction and send the
 * funding_created message.
 */
export class AcceptChannelMessage implements IWireMessage {
    public static type = MessageType.AcceptChannel;

    /**
     * Deserializes an accept_channel message
     * @param buf
     */
    public static deserialize(buf: Buffer): AcceptChannelMessage {
        const instance = new AcceptChannelMessage();
        const reader = new BufferReader(buf);

        reader.readUInt16BE(); // read type
        instance.temporaryChannelId = reader.readBytes(32);
        instance.dustLimitSatoshis = Value.fromSats(reader.readUInt64BE());
        instance.maxHtlcValueInFlightMsat = Value.fromMilliSats(reader.readUInt64BE());
        instance.channelReserveSatoshis = Value.fromSats(reader.readUInt64BE());
        instance.htlcMinimumMsat = Value.fromMilliSats(reader.readUInt64BE());
        instance.minimumDepth = reader.readUInt32BE();
        instance.toSelfDelay = reader.readUInt16BE();
        instance.maxAcceptedHtlcs = reader.readUInt16BE();
        instance.fundingPubKey = reader.readBytes(33);
        instance.revocationBasePoint = reader.readBytes(33);
        instance.paymentBasePoint = reader.readBytes(33);
        instance.delayedPaymentBasePoint = reader.readBytes(33);
        instance.htlcBasePoint = reader.readBytes(33);
        instance.firstPerCommitmentPoint = reader.readBytes(33);

        // Parse the TLVs
        readTlvs(reader, (type: bigint, valueReader: BufferReader) => {
            switch (type) {
                case BigInt(0): {
                    instance.upfrontShutdownScript = valueReader.readBytes();
                    return true;
                }
                default:
                    return false;
            }
        });

        return instance;
    }

    /**
     * The type for accept_channel message. accept_channel = 33
     */
    public type = AcceptChannelMessage.type;

    /**
     * A unique and temporary identifier used during the channel creation
     * process. This value is a placeholder for the channel_id that is
     * created from the funding transaction that can be used after the
     * funding_created message creates this transaction and the
     * counterparty uses the channel_id in the funding_signed message.
     */
    public temporaryChannelId: Buffer;

    /**
     * Indicates the value in satoshis under which outputs should not
     * be created for this node's commitment transaction or HTLC
     * transactions. This setting indicates the reality that small
     * transaction outputs are considered non-standard by the network and
     * will not be propagated.
     */
    public dustLimitSatoshis: Value;

    /**
     * Indicates the minimum amount that the counterparty is supposed to
     * keep as direct payment. This value must be equal or greater than
     * dust_limit_satoshis and SHOULD be 1% of the total value of the
     * channel. This value ensures that there is always value at stake
     * for a node to lose if it broadcasts an outdated commitment
     * transaction. Initially this value may not be met but as a channel
     * is used and the value is met, the reserve must be maintained.
     */
    public channelReserveSatoshis: Value;

    /**
     * Specifies the number of blocks the accepting party considers
     * reasonable to avoid double-spending of the funding transaction.
     * Once the funding transaction has reached this depth,
     * funding_locked messages will be sent by each peer to activate the
     * channel.
     */
    public minimumDepth: number;

    /**
     * Indicates the number of blocks the remote node must use to delay
     * retrieval of its to_local outputs. This value is used as input
     * to OP_CSV to create a relative timelock on RSMCs used in the
     * to_local output of the commitment transaction and the HTLC
     * transaction outputs. This allows us to use a penalty transaction
     * is there is a breach.
     */
    public toSelfDelay: number;

    /**
     * The minimum value in millisatoshi of an HTLC that we are willing
     * to accept.
     */
    public htlcMinimumMsat: Value;

    /**
     * The maximum value in millisatoshi of outstanding HTLCs we will
     * allow. This value allows us to limit our overall exposure to
     * HTLCs.
     */
    public maxHtlcValueInFlightMsat: Value;

    /**
     * The maximum number of outstanding HTLCs that we will allow. This
     * limits our exposure to a finite amount of HTLCs. This value must
     * be less than 483 as more than this will cause issues with the
     * commitment_signed message.
     */
    public maxAcceptedHtlcs: number;

    /**
     * The public key used in the 2-of-2 multisig script of the funding
     * transaction output. This value must a 33-byte compressed SEC
     * encoded public key for secp256k1.
     */
    public fundingPubKey: Buffer;

    /**
     * The revocation basepoint is used to derive a blinded
     * per-commitment revocation public key. Revocation public keys
     * are used in a remote node's version of the commitment
     * transactions and HTLC transactions and allow us the ability to
     * sweep funds if they broadcast a prior state transaction.
     */
    public revocationBasePoint: Buffer;

    /**
     * The payment basepoint is used to derive a per-commitment payment
     * public key.
     */
    public paymentBasePoint: Buffer;

    /**
     * The delayed payment basepoint is used to derive a per-commitment
     * payment public key that is sequence delayed. It is used in
     * in our local commitment transaction as well as the outputs of
     * HTLC transactions.
     */
    public delayedPaymentBasePoint: Buffer;

    /**
     * The HTLC basepoint is used to derive a per-commitment
     * public key used in HTLC outputs of the commitment transaction.
     */
    public htlcBasePoint: Buffer;

    /**
     * This is the first per-commitment point to be used for the first
     * commitment transaction. This point will be used by the remote
     * node to construct the public keys used when constructing and
     * signing our version of the commitment transaction. This point
     * will eventually be revoked and a we will send a new
     * commitment point.
     */
    public firstPerCommitmentPoint: Buffer;

    /**
     * When option_upfront_shutdown_script is negotiated during init
     * message exchange, this property will commit to using the provided
     * scriptPubKey during a mutual close. This value will be used
     * instead of the scriptPubKey provided during shutdown which
     * ensures that this scriptPubKey is used on close even if our node
     * is compromised.
     */
    public upfrontShutdownScript: Buffer;

    /**
     * Serializes the accept_channel message into a Buffer
     */
    public serialize(): Buffer {
        const writer = new BufferWriter();
        writer.writeUInt16BE(this.type);
        writer.writeBytes(this.temporaryChannelId);
        writer.writeUInt64BE(this.dustLimitSatoshis.sats);
        writer.writeUInt64BE(this.maxHtlcValueInFlightMsat.msats);
        writer.writeUInt64BE(this.channelReserveSatoshis.sats);
        writer.writeUInt64BE(this.htlcMinimumMsat.msats);
        writer.writeUInt32BE(this.minimumDepth);
        writer.writeUInt16BE(this.toSelfDelay);
        writer.writeUInt16BE(this.maxAcceptedHtlcs);
        writer.writeBytes(this.fundingPubKey);
        writer.writeBytes(this.revocationBasePoint);
        writer.writeBytes(this.paymentBasePoint);
        writer.writeBytes(this.delayedPaymentBasePoint);
        writer.writeBytes(this.htlcBasePoint);
        writer.writeBytes(this.firstPerCommitmentPoint);

        // upfront_shutdown_script TLV
        if (this.upfrontShutdownScript) {
            writer.writeBigSize(0);
            writer.writeBigSize(this.upfrontShutdownScript.length);
            writer.writeBytes(this.upfrontShutdownScript);
        }

        return writer.toBuffer();
    }
}
