/**
 * Bitmask is a generic class that accepts an enum where
 * each enum is a flag value. The values of the enum must
 * be convertible to a BigInt and therefore must be in the
 * form of a number (255), hex string (0xff), or
 * binary string (0b11111111).
 */
export class Bitmask<T> {
  public value: bigint;

  constructor(value?: bigint) {
    this.value = value || BigInt(0);
  }

  public has(flag: T): boolean {
    return (this.value & BigInt(flag)) > BigInt(0);
  }

  public set(flag: T) {
    this.value |= BigInt(flag);
  }

  public unset(flag: T) {
    this.value &= ~(this.value & BigInt(flag));
  }

  public toggle(flag: T) {
    this.value ^= BigInt(flag);
  }
}
