import { LightningEvent } from "./LightningEventQueue";
import { Result } from "./Result";
import { WireError } from "./WireError";

export type LightningEventResult = Result<LightningEvent, WireError>;
