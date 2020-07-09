import { IWireMessage } from "../messages/IWireMessage";

export enum GossipErrorCode {
    Unknown = 0,
    PeerNotReady,
    ReplyChannelRangeNoInformation,
    ReplyChannelsNoInfo,
}

export class GossipError extends Error {
    public code: GossipErrorCode;
    public wireMessage: IWireMessage;

    constructor(code: GossipErrorCode, wireMessage?: IWireMessage) {
        let message = "Unknown gossip error";
        switch (code) {
            case GossipErrorCode.ReplyChannelRangeNoInformation:
                message = "reply_channel_range had no information";
                break;
            case GossipErrorCode.ReplyChannelsNoInfo:
                message = "reply_short_channel_ids_end had no information";
                break;
        }
        super(message);
        this.code = code;
        this.wireMessage = wireMessage;
    }
}
