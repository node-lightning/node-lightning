import { IWireMessage } from "../messages/IWireMessage";

export enum GossipErrorCode {
    Unknown = 0,
    ReplyChannelRangeNoInformation = 1,
    ReplyChannelsNoInfo = 2,
}

export class GossipError extends Error {
    constructor(code: GossipErrorCode, wireMessage?: IWireMessage) {
        let message = "Unknown gossip error";
        switch (code) {
            case GossipErrorCode.ReplyChannelRangeNoInformation:
                message = "reply_channel_rnage had no information";
                break;
            case GossipErrorCode.ReplyChannelsNoInfo:
                message = "reply_short_channel_ids_end had no information";
                break;
        }
        super(message);
    }
}
