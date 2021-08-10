import { BufferReader, BufferWriter } from "@node-lightning/bufio";
import { BitField, Script } from "@node-lightning/core";
// import { BufferReader, BufferWriter } from "../../../bufio/lib/index";
// import { BitField } from "../../../../packages/core/lib/";
import { Value } from "../../../bitcoin/lib/Value";
import { OpenChannelFlags } from "../flags/OpenChannelFlags";
import { MessageType } from "../MessageType";
import { readTlvs } from "../serialize/readTlvs";
import { IWireMessage } from "./IWireMessage";

/**
 * OpenChannelMessage represents the open_channel message defined in
 * BOLT #2 of the Lightning Specification. This message is used to
 * initiate a channel with a connected peer. The channel initiator acts
 * as the funding node for the channel and specifies the amount and
 * parameters to be used in the channel. The remote peer can accept the
 * channel using the accept_channel message.
 */
export class OpenChannelMessage implements IWireMessage {
    public static type = MessageType.OpenChannel;

    /**
     * Deserializes an open_channel message
     * @param buf
     */
    public static deserialize(buf: Buffer): OpenChannelMessage {
        const instance = new OpenChannelMessage();
        const reader = new BufferReader(buf);

        reader.readUInt16BE(); // read type
        instance.chainHash = reader.readBytes(32);
        instance.temporaryChannelId = reader.readBytes(32);
        instance.fundingSatoshis = Value.fromSats(reader.readUInt64BE());
        instance.pushMsat = Value.fromMilliSats(reader.readUInt64BE());
        instance.dustLimitSatoshis = Value.fromSats(reader.readUInt64BE());
        instance.maxHtlcValueInFlightMsat = Value.fromMilliSats(reader.readUInt64BE());
        instance.channelReserveSatoshis = Value.fromSats(reader.readUInt64BE());
        instance.htlcMinimumMsat = Value.fromMilliSats(reader.readUInt64BE());
        instance.feeRatePerKw = Value.fromSats(reader.readUInt32BE());
        instance.toSelfDelay = reader.readUInt16BE();
        instance.maxAcceptedHtlcs = reader.readUInt16BE();
        instance.fundingPubKey = reader.readBytes(33);
        instance.revocationBasePoint = reader.readBytes(33);
        instance.paymentBasePoint = reader.readBytes(33);
        instance.delayedPaymentBasePoint = reader.readBytes(33);
        instance.htlcBasePoint = reader.readBytes(33);
        instance.firstPerCommitmentPoint = reader.readBytes(33);
        instance.channelFlags = new BitField<OpenChannelFlags>(BigInt(reader.readUInt8()));

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
     * The type for open_channel message. open_channel = 32
     */
    public type = OpenChannelMessage.type;

    /**
     * The chain_hash used to identifier the chain that the channel
     * should be opened on. Typically this value is the hash of the
     * genesis block in internal byte order.
     */
    public chainHash: Buffer;

    /**
     * A unique and temporary identifier used during the channel creation
     * process. This value is a placeholder for the channel_id that is
     * created from the funding transaction that can be used after the
     * funding_created message creates this transaction and the
     * counterparty uses the channel_id in the funding_signed message.
     */
    public temporaryChannelId: Buffer;

    /**
     * This value is the total value of the channel. It is value in
     * satoshis that will be locked into the 2-2 multisig output of the
     * funding transaction. This value must be less than 2^24 satoshis
     * unless option_large_channel is negotiated by both peers during
     * initialization.
     */
    public fundingSatoshis: Value;

    /**
     * This is the value in millisatoshi that is unconditionally pushed
     * to the counterparty of the channel. This value must be less than
     * 1000 * funding_satoshis. This value will be applied to the value
     * of the remote nodes commitment transaction output in the initial
     * commitment transaction.
     */
    public pushMsat: Value;

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
     * Indicates the transaction fee in satoshis per 1000-weight that
     * will be used for the commitment transaction and HTLC transactions.
     * This value is set by the funding node and can be adjusted using
     * the update_fee message. This value should be set to a value that
     * the funding node believes will result in the immediate inclusion
     * of the commitment transaction in a block.
     */
    public feeRatePerKw: Value;

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
     * transaction output. This value must a  33-byte compressed SEC
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
     * Flags are used to indicate channel features. Currently only the
     * least-significant bit is defined which enables public
     * announcement of the channel once the channel becomes live.
     */
    public channelFlags: BitField<OpenChannelFlags>;

    /**
     * Gets or sets whether the channel will be publicly announced once
     * the channel becomes live.
     */
    public get announceChannel(): boolean {
        return this.channelFlags.isSet(OpenChannelFlags.AnnounceChannel);
    }

    public set announceChannel(val: boolean) {
        if (val) {
            this.channelFlags.set(OpenChannelFlags.AnnounceChannel);
        } else {
            this.channelFlags.unset(OpenChannelFlags.AnnounceChannel);
        }
    }

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
     * Constructs a new OpenChannelMessage instance
     */
    constructor() {
        this.channelFlags = new BitField<OpenChannelFlags>();
    }

    /**
     * Serializes the open_channel message into a Buffer
     */
    public serialize(): Buffer {
        const writer = new BufferWriter();
        writer.writeUInt16BE(this.type);
        writer.writeBytes(this.chainHash);
        writer.writeBytes(this.temporaryChannelId);
        writer.writeUInt64BE(this.fundingSatoshis.sats);
        writer.writeUInt64BE(this.pushMsat.msats);
        writer.writeUInt64BE(this.dustLimitSatoshis.sats);
        writer.writeUInt64BE(this.maxHtlcValueInFlightMsat.msats);
        writer.writeUInt64BE(this.channelReserveSatoshis.sats);
        writer.writeUInt64BE(this.htlcMinimumMsat.msats);
        writer.writeUInt32BE(Number(this.feeRatePerKw.sats));
        writer.writeUInt16BE(this.toSelfDelay);
        writer.writeUInt16BE(this.maxAcceptedHtlcs);
        writer.writeBytes(this.fundingPubKey);
        writer.writeBytes(this.revocationBasePoint);
        writer.writeBytes(this.paymentBasePoint);
        writer.writeBytes(this.delayedPaymentBasePoint);
        writer.writeBytes(this.htlcBasePoint);
        writer.writeBytes(this.firstPerCommitmentPoint);
        writer.writeUInt8(this.announceChannel ? 0x01 : 0x00);

        // upfront_shutdown_script TLV
        if (this.upfrontShutdownScript) {
            writer.writeBigSize(0);
            writer.writeBigSize(this.upfrontShutdownScript.length);
            writer.writeBytes(this.upfrontShutdownScript);
        }

        return writer.toBuffer();
    }
}
