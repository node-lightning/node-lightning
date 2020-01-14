import { BufferCursor } from "@lntools/buffer-cursor";
import { TlvRecordSerializer } from "../../serialize/tlv-serializer";
import { TlvValueReader } from "../../serialize/tlv-value-reader";
import { TlvValueWriter } from "../../serialize/tlv-value-writer";

/**
 * TLV used in query_channel_range message. These options control
 * additional or gossip_query_ex data that is transmitted via the
 * reply_channel_range message.
 *
 * Checksum data is used to verify the a match on the contents of
 * a channel_update message.
 *
 * Timestamp data is used to validate the data.
 *
 * Typically message that include the gossip_query_ex data and use
 * this TLV will include both, or neither of the options.
 */
export class QueryChannelRangeOptions {
  public static type = BigInt(1);

  /**
   * Deserializes the value buffer for the TLV.
   * @param buf
   */
  public static deserialize(buf: Buffer): QueryChannelRangeOptions {
    const reader = new TlvValueReader(buf);
    const options = reader.readBigSize();
    return new QueryChannelRangeOptions(options);
  }

  public type: bigint = QueryChannelRangeOptions.type;
  private _options: bigint;
  private _timestampMask = BigInt(1 << 0);
  private _checksumMask = BigInt(1 << 1);

  constructor(options?: bigint) {
    this._options = options || BigInt(0);
  }

  public get options() {
    return this._options;
  }

  public get timestamp() {
    return (this._options & this._timestampMask) === this._timestampMask;
  }

  public get checksum() {
    return (this._options & this._checksumMask) === this._checksumMask;
  }

  public enableTimestamp() {
    this._enableOption(this._timestampMask);
    return this;
  }

  public disableTimestamp() {
    this._disableOption(this._timestampMask);
    return this;
  }

  public enableChecksum() {
    this._enableOption(this._checksumMask);
    return this;
  }

  public disableChecksum() {
    this._disableOption(this._checksumMask);
    return this;
  }

  /**
   * Serializes the value for the TLV
   */
  public serializeValue(): Buffer {
    const writer = new TlvValueWriter();
    writer.writeBigSize(BigInt(this._options));
    return writer.toBuffer();
  }

  /**
   * Serializes the TLV
   */
  public serializeTlv(): Buffer {
    const writer = new TlvRecordSerializer();
    return writer.serialize(this);
  }

  private _enableOption(mask: bigint) {
    this._options |= mask;
  }

  private _disableOption(mask: bigint) {
    this._options &= ~mask;
  }
}
