import { randomBytes } from "crypto";

export class Helpers {
    /**
     * Constructs a `temporary_channel_id` that is unique per peer and
     * per channel as defined in BOLT 2. Refer to {@link https://github.com/node-lightning/node-lightning/blob/main/docs/routines/createTempChannelId.md}.
     * @returns
     */
    public createTempChannelId(): Buffer {
        return randomBytes(32);
    }
}
