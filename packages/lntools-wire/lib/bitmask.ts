import * as bigintutil from "./bigint-util";

/**
 * Bitmask assists with bitmask flags. Methods are supplied
 * a zero-based bit index. Internally, values are stored as
 * BigInt so that more than 32 values can be set for the
 * Bitmask.
 */
export class Bitmask {
  /**
   * Constructs a bitmask from a number
   */
  public static fromNumber(value: number) {
    return new Bitmask(BigInt(value));
  }

  /**
   * Constructs a bitmask from a buffer
   */
  public static fromBuffer(value: Buffer) {
    if (value.length === 0) return new Bitmask();
    return new Bitmask(BigInt("0x" + value.toString("hex")));
  }

  public value: bigint;

  constructor(value?: bigint) {
    this.value = value || BigInt(0);
  }

  public isSet(bit: number): boolean {
    return (this.value & (BigInt(1) << BigInt(bit))) > BigInt(0);
  }

  public set(bit: number) {
    this.value |= BigInt(1) << BigInt(bit);
  }

  public unset(bit: number) {
    this.value &= ~(this.value & (BigInt(1) << BigInt(bit)));
  }

  public toggle(bit: number) {
    this.value ^= BigInt(1) << BigInt(bit);
  }

  public toBigInt() {
    return this.value;
  }

  public toNumber() {
    return Number(this.value);
  }

  public toBuffer(): Buffer {
    if (this.value === BigInt(0)) return Buffer.alloc(0);
    return bigintutil.bigintToBuffer(this.value);
  }
}
