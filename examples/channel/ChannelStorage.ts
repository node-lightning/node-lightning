import fs from "fs/promises";
import path from "path";
import { IChannelStorage } from "@node-lightning/lightning";
import { Channel } from "@node-lightning/lightning/dist/channels/Channel";
import { ChannelSide } from "@node-lightning/lightning/dist/channels/ChannelSide";

export class ChannelStorage implements IChannelStorage {
    constructor(readonly folder: string) {}

    /**
     * Incredibly basic storage mechanism. This does not encrypt sensitive data
     * nor take any measures to ensure disk-write failures do not wipe out
     * existing data.
     * @param channel
     */
    public async save(channel: Channel): Promise<void> {
        const filename = `channel_${channel.channelId.toString()}.json`;
        await fs.writeFile(
            path.join(this.folder, filename),
            JSON.stringify(JSON.stringify(channel)),
        );
    }
}
