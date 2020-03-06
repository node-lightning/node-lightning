import { MessageType } from "./message-type";
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
    case MessageType.Init:
      return InitMessage.deserialize(buffer);
    case MessageType.Error:
      return ErrorMessage.deserialize(buffer);
    case MessageType.Ping:
      return PingMessage.deserialize(buffer);
    case MessageType.Pong:
      return PongMessage.deserialize(buffer);

    // channel messages
    // [MESSAGE_TYPE.ANNOUNCEMENT_SIGNATURES]: messages.AnnouncementSignaturesMessage,
    case MessageType.NodeAnnouncement:
      return NodeAnnouncementMessage.deserialize(buffer);
    case MessageType.ChannelAnnouncement:
      return ChannelAnnouncementMessage.deserialize(buffer);
    case MessageType.ChannelUpdate:
      return ChannelUpdateMessage.deserialize(buffer);

    case MessageType.QueryShortChannelIds:
      return QueryShortChannelIdsMessage.deserialize(buffer);
    case MessageType.ReplyShortChannelIdsEnd:
      return ReplyShortChannelIdsEndMessage.deserialize(buffer);
    case MessageType.QueryChannelRange:
      return QueryChannelRangeMessage.deserialize(buffer);
    case MessageType.ReplyChannelRange:
      return ReplyChannelRangeMessage.deserialize(buffer);
    case MessageType.GossipTimestampFilter:
      return GossipTimestampFilterMessage.deserialize(buffer);
  }
}
