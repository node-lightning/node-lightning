import { IWireMessage } from "../messages/IWireMessage";

export enum GossipErrorCode {
    Unknown = 0,
    ReplyChannelRangeNoInformation = 1,
}

export class GossipError extends Error {
    constructor(code: GossipErrorCode, wireMessage?: IWireMessage) {
        let message = "Unknown gossip error";
        switch (code) {
            case GossipErrorCode.ReplyChannelRangeNoInformation:
                message = "reply_channel_rnage had no information";
                break;
        }
        super(message);
    }
}
