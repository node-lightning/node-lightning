import { AcceptChannelMessage } from "./messages/AcceptChannelMessage";
import { AnnouncementSignaturesMessage } from "./messages/AnnouncementSignaturesMessage";
import { ChannelAnnouncementMessage } from "./messages/ChannelAnnouncementMessage";
import { ChannelUpdateMessage } from "./messages/ChannelUpdateMessage";
import { ClosingSignedMessage } from "./messages/ClosingSignedMessage";
import { ErrorMessage } from "./messages/ErrorMessage";
import { FundingCreatedMessage } from "./messages/FundingCreatedMessage";
import { FundingLockedMessage } from "./messages/FundingLockedMessage";
import { FundingSignedMessage } from "./messages/FundingSignedMessage";
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

export class MessageFactory {
    public static deserialize(buffer: Buffer): IWireMessage {
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
            case MessageType.FundingCreated:
                return FundingCreatedMessage.deserialize(buffer);
            case MessageType.FundingSigned:
                return FundingSignedMessage.deserialize(buffer);
            case MessageType.FundingLocked:
                return FundingLockedMessage.deserialize(buffer);
            case MessageType.AnnouncementSignatures:
                return AnnouncementSignaturesMessage.deserialize(buffer);
            case MessageType.Shutdown:
                return ShutdownMessage.deserialize(buffer);
            case MessageType.ClosingSigned:
                return ClosingSignedMessage.deserialize(buffer);

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

    public static isInit(m: IWireMessage): m is InitMessage {
        return m.type === MessageType.Init;
    }

    public static isError(m: IWireMessage): m is ErrorMessage {
        return m.type === MessageType.Error;
    }

    public static isPing(m: IWireMessage): m is PingMessage {
        return m.type === MessageType.Ping;
    }

    public static isOpenChannel(m: IWireMessage): m is OpenChannelMessage {
        return m.type === MessageType.OpenChannel;
    }

    public static isAcceptChannel(m: IWireMessage): m is AcceptChannelMessage {
        return m.type === MessageType.AcceptChannel;
    }

    public static isFundingCreated(m: IWireMessage): m is FundingCreatedMessage {
        return m.type === MessageType.FundingCreated;
    }

    public static isFundingSigned(m: IWireMessage): m is FundingSignedMessage {
        return m.type === MessageType.FundingSigned;
    }

    public static isFundingLocked(m: IWireMessage): m is FundingLockedMessage {
        return m.type === MessageType.FundingLocked;
    }

    public static isAnnouncementSignatures(m: IWireMessage): m is AnnouncementSignaturesMessage {
        return m.type === MessageType.AnnouncementSignatures;
    }
}
