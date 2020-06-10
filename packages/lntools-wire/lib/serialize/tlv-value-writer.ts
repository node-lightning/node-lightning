import { ShortChannelId } from "../ShortChannelId";

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

  public writeUInt64(val: bigint) {
    const buf = Buffer.from(val.toString(16).padStart(16, "0"), "hex");
    this.writeBytes(buf);
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

  public writeTUInt64(val: bigint) {
    if (val === BigInt(0)) return;
    let valString = val.toString(16);
    if (valString.length % 2 === 1) valString = "0" + valString;
    const buf = Buffer.from(valString, "hex");
    this.writeBytes(buf);
  }

  public writeBigSize(num: bigint) {
    if (num < BigInt(0xfd)) {
      this.writeUInt8(Number(num));
    } else if (num < BigInt(0x10000)) {
      this.writeUInt8(0xfd);
      this.writeUInt16(Number(num));
    } else if (num < BigInt(0x100000000)) {
      this.writeUInt8(0xfe);
      this.writeUInt32(Number(num));
    } else {
      this.writeUInt8(0xff);
      this.writeUInt64(num);
    }
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
