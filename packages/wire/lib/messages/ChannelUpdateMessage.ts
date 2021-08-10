import { BufferReader, BufferWriter } from "@node-lightning/bufio";
import { BitField, ShortChannelId } from "@node-lightning/core";
import { shortChannelIdFromBuffer } from "@node-lightning/core";
// import { BufferReader, BufferWriter } from "../../../bufio/lib/index";
// import { BitField, ShortChannelId, shortChannelIdFromBuffer } from "../../../../packages/core/lib/";
import { Value } from "../../../bitcoin/lib/Value";
import * as crypto from "@node-lightning/crypto";
import { Checksum } from "../domain/Checksum";
import { ChannelUpdateMessageFlags } from "../flags/ChannelUpdateMessageFlags";
import { ChannelUpdateChannelFlags } from "../flags/ChanneUpdateChannelFlags";
import { MessageType } from "../MessageType";
import { IWireMessage } from "./IWireMessage";

/**
 * After a channel has been announced, each side independently announces the fees
 * and minimum expiry delta it requires to relay HTLCs through this channel. A
 * node can broadcast this message multiple times in order to change fees.
 */
export class ChannelUpdateMessage implements IWireMessage {
    /**
     * Deserializes the message from a Buffer. The message
     * is not validated in this function.
     */
    public static deserialize(payload: Buffer): ChannelUpdateMessage {
        const instance = new ChannelUpdateMessage();
        const reader = new BufferReader(payload);
        reader.readUInt16BE(); // read off type

        instance.signature = reader.readBytes(64);
        instance.chainHash = reader.readBytes(32);
        instance.shortChannelId = shortChannelIdFromBuffer(reader.readBytes(8));
        instance.timestamp = reader.readUInt32BE();
        instance.messageFlags = BitField.fromNumber(reader.readUInt8());
        instance.channelFlags = BitField.fromNumber(reader.readUInt8());
        instance.cltvExpiryDelta = reader.readUInt16BE();
        instance.htlcMinimumMsat = Value.fromMilliSats(reader.readUInt64BE());
        instance.feeBaseMsat = Value.fromMilliSats(reader.readUInt32BE());
        instance.feeProportionalMillionths = Value.fromMillionthSats(reader.readUInt32BE());

        // has optional_channel_htlc_max
        if (instance.hasHtlcMaximumMsatFlag) {
            instance.htlcMaximumMsat = Value.fromMilliSats(reader.readUInt64BE());
        }

        return instance;
    }

    /**
     * Performs a double SHA-256 hash of the message with all
     * data excluding the signature data
     */
    public static hashForSignature(message: ChannelUpdateMessage): Buffer {
        const raw = message.serialize().slice(66);
        return crypto.hash256(raw);
    }

    /**
     * Performs signature validation for the message by
     * hashing the data post signature. A passing signature
     * indicates that the message was submitted by the node
     * that owns the channel. Becuase the nodeId is not included
     * in the message, we need to obtain the nodeId by accessing
     * the ChannelAnnouncementMessage and determining the public key
     * @param message
     * @param pubkey 33-byte ECDSA public key
     */
    public static validateSignature(message: ChannelUpdateMessage, pubkey: Buffer) {
        const sigmsg = ChannelUpdateMessage.hashForSignature(message);
        return crypto.verifySig(sigmsg, message.signature, pubkey);
    }

    /**
     * Message type is 258
     */
    public type: MessageType = MessageType.ChannelUpdate;

    /**
     * 64-byte buffer containing the ECDSA secp256k1 signature of the double
     * SHA256 hash of the message as signed by the originating node.
     */
    public signature: Buffer;

    /**
     * Must set chain_hash to a 32-byte hash that uniquely identifies
     * the chain that the channel opened within.
     */
    public chainHash: Buffer;

    /**
     * ShortChannelId is a unique reference to the funding output of the
     * channel.
     */
    public shortChannelId: ShortChannelId;

    /**
     * Timestamp of the update message and is used to indicate ordering of
     * messages if multiple messages are sent by the same node.
     */
    public timestamp: number;

    /**
     * Indicate the presence of optional fields in the channel_update message.
     *   bit, field
     *   0, htlc_maximum_msat
     */
    public messageFlags: BitField<ChannelUpdateMessageFlags> = new BitField();

    /**
     * Indicates the direction of the channel: it identifies the node that this
     * update originated from and signals various options concerning the channel
     * such as whether it is disabled.
     *   bit, name
     *   0, direction
     *   1, disabled
     */
    public channelFlags: BitField<ChannelUpdateChannelFlags> = new BitField();

    /**
     * The number of blocks the channel will subtract from an incoming
     * HTLC's cltv_expiry.
     */
    public cltvExpiryDelta: number;

    /**
     * The minimum HTLC value (in millisatoshi) that the channel peer
     * will accept.
     */
    public htlcMinimumMsat: Value;

    /**
     * The maximum value (in millisatoshi) it will send through this
     * channel for a single HTLC. This value must be less than the
     * channel capacity. This value will only be available when the
     * message flag option_channel_htlc_max is set.
     */
    public htlcMaximumMsat: Value;

    /**
     * The base fee (in millisatoshi) the channel will charge for
     * any HTLC.
     */
    public feeBaseMsat: Value;

    /**
     * The amount (in millionths of a satoshi) it will charge per
     * transferred satoshi.
     */
    public feeProportionalMillionths: Value;

    /**
     * Returns true when message flags have the optional
     * maximum HTLC msat value available
     */
    public get hasHtlcMaximumMsatFlag(): boolean {
        return this.messageFlags.isSet(0);
    }

    /**
     * Direction is determined by channel_flags bit 0.
     * When set to 0, node_1 is the sender. When set to 1
     * node_2 is the sender
     */
    public get direction(): number {
        return this.channelFlags.isSet(0) ? 1 : 0;
    }

    public set direction(val: number) {
        if (val === 0) {
            this.channelFlags.unset(0);
        } else if (val === 1) {
            this.channelFlags.set(0);
        } else {
            throw new Error("Invlid direction");
        }
    }

    /**
     * Disabled flag is determined by channel_flags bit 1.
     * When set to 0, the channel is active. When set to 1
     * the channel is disabled.
     */
    public get disabled(): boolean {
        return this.channelFlags.isSet(1);
    }

    public set disabled(val: boolean) {
        if (val) {
            this.channelFlags.set(1);
        } else {
            this.channelFlags.unset(1);
        }
    }

    /**
     * Serializes the instance into a Buffer that can be
     * transmitted over the wire
     */
    public serialize() {
        const len =
            2 + // type
            64 + // signature
            32 + // chain_hash
            8 + // short_channel_id
            4 + // timestamp
            1 + // message_flags
            1 + // channel_flags
            2 + // cltv_expiry_delta
            8 + // htlc_minimum_msat
            4 + // fee_base_msat
            4 + // fee_proportional_millionths
            (this.hasHtlcMaximumMsatFlag ? 8 : 0);

        const writer = new BufferWriter(Buffer.alloc(len));
        writer.writeUInt16BE(this.type);
        writer.writeBytes(this.signature);
        writer.writeBytes(this.chainHash);
        writer.writeBytes(this.shortChannelId.toBuffer());
        writer.writeUInt32BE(this.timestamp);
        writer.writeUInt8(this.messageFlags.toNumber());
        writer.writeUInt8(this.channelFlags.toNumber());
        writer.writeUInt16BE(this.cltvExpiryDelta);
        writer.writeUInt64BE(this.htlcMinimumMsat.msats);
        writer.writeUInt32BE(Number(this.feeBaseMsat.msats));
        writer.writeUInt32BE(Number(this.feeProportionalMillionths.millionthsats));
        if (this.hasHtlcMaximumMsatFlag) {
            writer.writeUInt64BE(this.htlcMaximumMsat.msats);
        }
        return writer.toBuffer();
    }

    /**
     * CRC32C checksum is calculated from the raw channel_update
     * message and excludes the signature and timestamp.
     *
     * @remarks
     * Defined in BOLT 07 gossip queries section:
     * https://github.com/lightningnetwork/lightning-rfc/blob/master/07-routing-gossip.md#query-messages
     *
     */
    public checksum(): Checksum {
        const len =
            2 + // type
            32 + // chain_hash
            8 + // short_channel_id
            1 + // message_flags
            1 + // channel_flags
            2 + // cltv_expiry_delta
            8 + // htlc_minimum_msat
            4 + // fee_base_msat
            4 + // fee_proportional_millionths
            (this.hasHtlcMaximumMsatFlag ? 8 : 0);

        const writer = new BufferWriter(Buffer.alloc(len));
        writer.writeUInt16BE(this.type);
        writer.writeBytes(this.chainHash);
        writer.writeBytes(this.shortChannelId.toBuffer());
        writer.writeUInt8(Number(this.messageFlags));
        writer.writeUInt8(Number(this.channelFlags));
        writer.writeUInt16BE(this.cltvExpiryDelta);
        writer.writeUInt64BE(this.htlcMinimumMsat.msats);
        writer.writeUInt32BE(Number(this.feeBaseMsat.msats));
        writer.writeUInt32BE(Number(this.feeProportionalMillionths.millionthsats));
        if (this.hasHtlcMaximumMsatFlag) {
            writer.writeUInt64BE(this.htlcMaximumMsat.msats);
        }
        return Checksum.fromBuffer(writer.toBuffer());
    }
}
