import { LightningEvent } from "./LightningEvent";

export interface ILightningEventMuxer {
    onEvent(event: LightningEvent): Promise<void>;
}
