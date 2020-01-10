import { MESSAGE_TYPE } from "../message-type";

export interface IWireMessage {
  type: MESSAGE_TYPE;
  serialize(): Buffer;
}
