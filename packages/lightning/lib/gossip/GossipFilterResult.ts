import { IWireMessage } from "../messages/IWireMessage";
import { Result } from "../Result";
import { WireError } from "../WireError";

export type GossipFilterResult = Result<IWireMessage[], WireError>;
