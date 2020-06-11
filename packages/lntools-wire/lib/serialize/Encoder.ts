import { EncodingType } from "./EncodingType";
import { ZlibEncoder } from "./ZlibEncoder";

export class Encoder {
    public encode(encoding: EncodingType, data: Buffer): Buffer {
        let encoded: Buffer;
        switch (encoding) {
            case EncodingType.Raw:
                encoded = data;
                break;
            case EncodingType.ZlibDeflate:
                encoded = new ZlibEncoder().encode(data);
                break;
            default:
                throw new Error("Unknown encoding type");
        }
        return Buffer.concat([Buffer.from([encoding]), encoded]);
    }

    public decode(buffer: Buffer): Buffer {
        const encoding = buffer.readUInt8(0);
        const raw = buffer.slice(1);
        switch (encoding) {
            case EncodingType.Raw:
                return raw;
            case EncodingType.ZlibDeflate:
                return new ZlibEncoder().decode(raw);
            default:
                throw new Error("Unknown encoding type");
        }
    }
}
