import { Block } from "@node-lightning/bitcoin";
import { IWireMessage } from "../messages/IWireMessage";
import { ChannelEventType } from "./ChannelEventType";

export class ChannelEvent {
    public message: IWireMessage;
    public block: Block;

    constructor(readonly type: ChannelEventType) {}
}
