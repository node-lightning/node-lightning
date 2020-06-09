import { BitField } from "../../BitField";
import { QueryChannelRangeFlags } from "../../flags/QueryChannelRangeFlags";
import { TlvValueReader } from "../../serialize/tlv-value-reader";
import { TlvValueWriter } from "../../serialize/tlv-value-writer";
import { Tlv } from "./Tlv";

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
export class QueryChannelRangeOptions extends Tlv {
  public static type = BigInt(1);

  /**
   * Deserializes the value buffer for the TLV.
   */
  public static deserialize(reader: TlvValueReader): QueryChannelRangeOptions {
    const options = reader.readBigSize();
    return new QueryChannelRangeOptions(options);
  }

  public type: bigint = QueryChannelRangeOptions.type;

  public options: BitField<QueryChannelRangeFlags>;

  constructor(options?: bigint) {
    super();
    this.options = new BitField(options);
  }

  public get timestamp() {
    return this.options.isSet(QueryChannelRangeFlags.timestamps);
  }

  public set timestamp(val: boolean) {
    if (val) this.options.set(QueryChannelRangeFlags.timestamps);
    else this.options.unset(QueryChannelRangeFlags.timestamps);
  }

  public get checksum() {
    return this.options.isSet(QueryChannelRangeFlags.checksums);
  }

  public set checksum(val: boolean) {
    if (val) this.options.set(QueryChannelRangeFlags.checksums);
    else this.options.unset(QueryChannelRangeFlags.checksums);
  }

  public serializeValue(): Buffer {
    const writer = new TlvValueWriter();
    writer.writeBigSize(BigInt(this.options.value));
    return writer.toBuffer();
  }
}
