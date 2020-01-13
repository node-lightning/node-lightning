import assert from "assert";
import BN = require("bn.js");
import { ShortChannelId, shortChannelIdFromBuffer } from "../shortchanid";

export class TlvValueWriter {
  private _buffer: Buffer;
  private _position: number = 0;

  constructor() {
    this._buffer = Buffer.alloc(1024);
  }

  public toBuffer(): Buffer {
    return this._buffer.slice(0, this._position);
  }

  public writeUInt8(val: number) {
    const size = 1;
    this.expand(size);
    this._buffer.writeUInt8(val, this._position);
    this._position += size;
  }

  public writeUInt16(val: number) {
    const size = 2;
    this.expand(size);
    this._buffer.writeUInt16BE(val, this._position);
    this._position += size;
  }

  public writeUInt32(val: number) {
    const size = 4;
    this.expand(size);
    this._buffer.writeUInt32BE(val, this._position);
    this._position += size;
  }

  public writeUInt64(val: BN) {
    const size = 8;
    this.expand(size);
    val.toBuffer("be", size).copy(this._buffer, this._position);
    this._position += size;
  }

  public writeTUInt16(val: number) {
    if (val === 0) return;
    const size = val > 0xff ? 2 : 1;
    this.expand(size);
    this._buffer.writeUIntBE(val, this._position, size);
    this._position += size;
  }

  public writeTUInt32(val: number) {
    if (val === 0) return;
    const size = val > 0xffffff ? 4 : val > 0xffff ? 3 : val > 0xff ? 2 : 1;
    this.expand(size);
    this._buffer.writeUIntBE(val, this._position, size);
    this._position += size;
  }

  public writeTUInt64(val: BN) {
    const size = val.byteLength();
    this.expand(size);
    val.toBuffer("be").copy(this._buffer, this._position);
    this._position += size;
  }

  public writeChainHash(val: Buffer) {
    this.writeBytes(val);
  }

  public writeChannelId(val: Buffer) {
    this.writeBytes(val);
  }

  public writeSha256(val: Buffer) {
    this.writeBytes(val);
  }

  public writeSignature(val: Buffer) {
    this.writeBytes(val);
  }

  public writePoint(val: Buffer) {
    this.writeBytes(val);
  }

  public writeShortChannelId(scid: ShortChannelId) {
    this.writeBytes(scid.toBuffer());
  }

  public writeBytes(buf: Buffer) {
    this.expand(buf.length);
    buf.copy(this._buffer, this._position);
    this._position += buf.length;
  }

  private expand(size: number) {
    if (this._position + size > this._buffer.length) {
      const newBuf = Buffer.alloc(this._buffer.length * 2);
      this._buffer.copy(newBuf);
      this._buffer = newBuf;
    }
  }
}
