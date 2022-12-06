import { Channel } from "./Channel";

export interface IChannelStorage {
    save(channel: Channel): Promise<void>;
}
