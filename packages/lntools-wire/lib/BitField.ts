import * as bigintutil from "./BigIntUtils";

/**
 * BitField assists with using bit flags to set or unset values in the bit
 * field. Preferrably a flag type is provided, otherwise it defaults to allow
 * arbitrary setting of integers corresponding to a particular bit index.
 *
 * Internally, values are stored as bigint so that more than 32 values
 * can be used since there is a limit of 31 digits that can be manipulated
 * using bitwise operations in JavaScript.
 */
export class BitField<T = number> {
  /**
   * Constructs a bitmask from a number
   */
  public static fromNumber(value: number) {
    return new BitField(BigInt(value));
  }

  /**
   * Constructs a bitmask from a buffer
   */
  public static fromBuffer(value: Buffer) {
    if (value.length === 0) return new BitField();
    return new BitField(BigInt("0x" + value.toString("hex")));
  }

  public value: bigint;

  constructor(value?: bigint) {
    this.value = value || BigInt(0);
  }

  public isSet(bit: T): boolean {
    return (this.value & (BigInt(1) << BigInt(bit))) > BigInt(0);
  }

  public set(bit: T) {
    this.value |= BigInt(1) << BigInt(bit);
  }

  public unset(bit: T) {
    this.value &= ~(this.value & (BigInt(1) << BigInt(bit)));
  }

  public toggle(bit: T) {
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
