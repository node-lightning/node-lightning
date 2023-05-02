import { ChannelEvent } from "./ChannelEvent";
import { TransitionResult } from "./TransitionResult";

export type TransitionFn = (event: ChannelEvent) => Promise<TransitionResult>;
