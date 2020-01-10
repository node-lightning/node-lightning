import zlib from "zlib";

export class ZlibDecoder {
  public decode(payload: Buffer): Buffer {
    return zlib.inflateSync(payload);
  }
}
