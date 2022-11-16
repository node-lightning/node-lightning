import zlib from "zlib";

export class ZlibEncoder {
    public encode(payload: Buffer): Buffer {
        return zlib.deflateSync(payload);
    }

    public decode(payload: Buffer): Buffer {
        return zlib.inflateSync(payload);
    }
}
