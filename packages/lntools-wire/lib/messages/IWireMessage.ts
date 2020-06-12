import { MessageType } from "../MessageType";

export interface IWireMessage {
    type: MessageType;
    serialize(): Buffer;
}
