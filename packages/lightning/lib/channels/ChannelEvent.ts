import { Block } from "@node-lightning/bitcoin";
import { IWireMessage } from "../messages/IWireMessage";
import { ChannelEventType } from "./ChannelEventType";
import { Channel } from "./Channel";

export class ChannelEvent {
    public message: IWireMessage;
    public block: Block;

    constructor(readonly type: ChannelEventType, readonly channel: Channel) {}
}
