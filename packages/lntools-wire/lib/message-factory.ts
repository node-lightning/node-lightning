import { MESSAGE_TYPE } from "./message-type";
import { ChannelAnnouncementMessage } from "./messages/channel-announcement-message";
import { ChannelUpdateMessage } from "./messages/channel-update-message";
import { ErrorMessage } from "./messages/error-message";
import { GossipTimestampFilterMessage } from "./messages/gossip-timestamp-filter-message";
import { InitMessage } from "./messages/init-message";
import { NodeAnnouncementMessage } from "./messages/node-announcement-message";
import { PingMessage } from "./messages/ping-message";
import { PongMessage } from "./messages/pong-message";
import { QueryChannelRangeMessage } from "./messages/query-channel-range-message";
import { QueryShortChannelIdsMessage } from "./messages/query-short-channel-ids-message";
import { ReplyChannelRangeMessage } from "./messages/reply-channel-range-message";
import { ReplyShortChannelIdsEndMessage } from "./messages/reply-short-channel-ids-end-message";
import { IWireMessage } from "./messages/wire-message";

export function deserialize(buffer: Buffer): IWireMessage {
  const type = buffer.readUInt16BE(0);

  switch (type) {
    // control messages
    case MESSAGE_TYPE.INIT:
      return InitMessage.deserialize(buffer);
    case MESSAGE_TYPE.ERROR:
      return ErrorMessage.deserialize(buffer);
    case MESSAGE_TYPE.PING:
      return PingMessage.deserialize(buffer);
    case MESSAGE_TYPE.PONG:
      return PongMessage.deserialize(buffer);

    // channel messages
    // [MESSAGE_TYPE.ANNOUNCEMENT_SIGNATURES]: messages.AnnouncementSignaturesMessage,
    case MESSAGE_TYPE.NODE_ANNOUNCEMENT:
      return NodeAnnouncementMessage.deserialize(buffer);
    case MESSAGE_TYPE.CHANNEL_ANNOUNCEMENT:
      return ChannelAnnouncementMessage.deserialize(buffer);
    case MESSAGE_TYPE.CHANNEL_UPDATE:
      return ChannelUpdateMessage.deserialize(buffer);

    case MESSAGE_TYPE.QUERY_SHORT_CHANNEL_IDS:
      return QueryShortChannelIdsMessage.deserialize(buffer);
    case MESSAGE_TYPE.REPLY_SHORT_CHANNEL_IDS_END:
      return ReplyShortChannelIdsEndMessage.deserialize(buffer);
    case MESSAGE_TYPE.QUERY_CHANNEL_RANGE:
      return QueryChannelRangeMessage.deserialize(buffer);
    case MESSAGE_TYPE.REPLY_CHANNEL_RANGE:
      return ReplyChannelRangeMessage.deserialize(buffer);
    case MESSAGE_TYPE.GOSSIP_TIMESTAMP_FILTER:
      return GossipTimestampFilterMessage.deserialize(buffer);
  }
}
