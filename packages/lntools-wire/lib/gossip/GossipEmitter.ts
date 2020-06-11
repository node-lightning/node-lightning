import { IWireMessage } from "../messages/IWireMessage";

export interface IGossipEmitter {
    on(event: "message", fn: (msg: IWireMessage) => void);
}
