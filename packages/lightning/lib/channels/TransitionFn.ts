import { Channel } from "./Channel";
import { ChannelEvent } from "./ChannelEvent";
import { TransitionResult } from "./TransitionResult";

export type TransitionFn = (channel: Channel, event: ChannelEvent) => Promise<TransitionResult>;
