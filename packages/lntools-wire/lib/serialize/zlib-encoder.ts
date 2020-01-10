import zlib from "zlib";

export class ZlibEncoder {
  public encode(payload: Buffer): Buffer {
    return zlib.deflateSync(payload);
  }
}
