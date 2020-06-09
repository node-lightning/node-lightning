import { MessageType } from "../message-type";

export interface IWireMessage {
  type: MessageType;
  serialize(): Buffer;
}
