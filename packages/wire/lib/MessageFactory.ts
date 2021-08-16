import { AcceptChannelMessage } from "./messages/AcceptChannelMessage";
import { ChannelAnnouncementMessage } from "./messages/ChannelAnnouncementMessage";
import { ChannelUpdateMessage } from "./messages/ChannelUpdateMessage";
import { ErrorMessage } from "./messages/ErrorMessage";
import { GossipTimestampFilterMessage } from "./messages/GossipTimestampFilterMessage";
import { InitMessage } from "./messages/InitMessage";
import { IWireMessage } from "./messages/IWireMessage";
import { NodeAnnouncementMessage } from "./messages/NodeAnnouncementMessage";
import { OpenChannelMessage } from "./messages/OpenChannelMessage";
import { PingMessage } from "./messages/PingMessage";
import { PongMessage } from "./messages/PongMessage";
import { QueryChannelRangeMessage } from "./messages/QueryChannelRangeMessage";
import { QueryShortChannelIdsMessage } from "./messages/QueryShortChannelIdsMessage";
import { ReplyChannelRangeMessage } from "./messages/ReplyChannelRangeMessage";
import { ReplyShortChannelIdsEndMessage } from "./messages/ReplyShortChannelIdsEndMessage";
import { ShutdownMessage } from "./messages/ShutdownMessage";
import { MessageType } from "./MessageType";

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
        case MessageType.OpenChannel:
            return OpenChannelMessage.deserialize(buffer);
        case MessageType.AcceptChannel:
            return AcceptChannelMessage.deserialize(buffer);
        case MessageType.Shutdown:
            return ShutdownMessage.deserialize(buffer);

        // gossip messages
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
