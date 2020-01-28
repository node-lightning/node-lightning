import { IWireMessage } from "../messages/wire-message";

export interface IGossipEmitter {
  on(event: "message", fn: (msg: IWireMessage) => void);
}
