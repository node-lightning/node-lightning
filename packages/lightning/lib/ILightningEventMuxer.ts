import { LightningEvent } from "./LightningEvent";
import { LightningEventResult } from "./LightningEventResult";

export interface ILightningEventMuxer {
    onEvent(event: LightningEvent): Promise<LightningEventResult>;
}
