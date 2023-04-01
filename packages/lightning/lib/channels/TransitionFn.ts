import { Channel } from "./Channel";
import { ChannelEvent } from "./ChannelEvent";
import { ChannelStateId } from "./StateMachineFactory";

export type TransitionFn = (
    channel: Channel,
    event: ChannelEvent,
) => Promise<ChannelStateId | undefined>;
