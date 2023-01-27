import { LightningEvent } from "./EventQueue";
import { Result } from "./Result";
import { WireError } from "./WireError";

export type LightningEventResult = Result<LightningEvent, WireError>;
