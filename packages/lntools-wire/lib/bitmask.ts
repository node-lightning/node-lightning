/**
 * Bitmask assists with bitmask flags. Methods are supplied
 * a zero-based bit index. Internally, values are stored as
 * BigInt so that more than 32 values can be set for the
 * Bitmask.
 */
export class Bitmask {
  public value: bigint;

  constructor(value?: bigint) {
    this.value = value || BigInt(0);
  }

  public has(bit: number): boolean {
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

  public valueOf() {
    return this.value;
  }
}
