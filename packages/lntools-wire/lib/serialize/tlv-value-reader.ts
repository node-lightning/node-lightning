import BN = require("bn.js");
import { ShortChannelId, shortChannelIdFromBuffer } from "../shortchanid";

export class TlvValueReader {
  private _buffer: Buffer;
  private _position: number = 0;

  constructor(buf: Buffer) {
    this._buffer = buf;
  }

  get eof(): boolean {
    return this._position === this._buffer.length;
  }

  public readUInt(): number {
    const val = this._buffer.readUInt8(this._position);
    this._position += 1;
    return val;
  }

  public readUInt16(): number {
    const val = this._buffer.readUInt16BE(this._position);
    this._position += 2;
    return val;
  }

  public readUInt32(): number {
    const val = this._buffer.readUInt32BE(this._position);
    this._position += 4;
    return val;
  }

  public readUInt64(): BN {
    const val = new BN(this._buffer.slice(this._position, this._position + 8), "be");
    this._position += 8;
    return val;
  }

  public readTUInt16(): number {
    const size = this._buffer.length - this._position;
    const val = this._buffer.readUIntBE(this._position, size);
    this._position += size;
    return val;
  }

  public readTUInt32(): number {
    const size = this._buffer.length - this._position;
    const val = this._buffer.readUIntBE(this._position, size);
    this._position += size;
    return val;
  }

  public readTUInt64(): BN {
    const size = this._buffer.length - this._position;
    const val = new BN(this._buffer.slice(this._position, this._position + size), "be");
    this._position += size;
    return val;
  }

  public readBigSize(): bigint {
    const first = this.readUInt();
    if (first < 0xfd) return BigInt(first);
    if (first === 0xfd) return BigInt(this.readUInt16());
    if (first === 0xfe) return BigInt(this.readUInt32());
    else return BigInt("0x" + this.readBytes(8).toString("hex"));
  }

  public readChainHash(): Buffer {
    return this.readBytes(32);
  }

  public readChannelId(): Buffer {
    return this.readBytes(32);
  }

  public readSha256(): Buffer {
    return this.readBytes(32);
  }

  public readSignature(): Buffer {
    return this.readBytes(64);
  }

  public readPoint(): Buffer {
    return this.readBytes(33);
  }

  public readShortChannelId(): ShortChannelId {
    return shortChannelIdFromBuffer(this.readBytes(8));
  }

  public readBytes(size: number) {
    const val = Buffer.from(this._buffer.slice(this._position, this._position + size));
    this._position += size;
    return val;
  }
}
