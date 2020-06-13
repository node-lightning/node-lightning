import crypto from "crypto";
import { LegacyHopData } from "./LegacyHopData";

export class HopPayload {
    public static parse(buf: Buffer) {
        // read len
        // read hop_payload
        // read hmac
        // validate hmac
    }

    public hopData: LegacyHopData;
    public hmac: Buffer;

    public toBuffer(): Buffer {
        // bigsize len
        // hopData.toBuffer()
        // hmac
        return Buffer.concat([]);
    }
}
