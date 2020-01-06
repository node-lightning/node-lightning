import BN from "bn.js";
const one = new BN(1);

/**
 * Creates a mask value for the specified bit.
 * BN equivalent of 1 << bit
 */
export function maskn(bit: number): BN {
  if (bit < 0) throw new Error("bit must be unsigned integer");

  // 1 << bit
  return one.shln(bit);
}

/**
 * Sets the bit in-place on the flags object. This is the
 * JavaScript equivalent of flags |= mask.
 */
export function isetn(flags: BN, bit: number): BN {
  if (!(flags instanceof BN)) throw new Error("flags must be a BN");

  // flags |= mask
  return flags.ior(maskn(bit));
}

/**
 * Unsets the bit in-place on the flags object.
 * This is the equivalent of flags |= ~mask.
 */
export function iunsetn(flags: BN, bit: number): BN {
  if (!(flags instanceof BN)) throw new Error("flags must be a BN");

  // xor the mask if we have a value (toggle it off)
  // flags ^= mask
  if (flags.testn(bit)) {
    return flags.ixor(maskn(bit));
  }
  // otherwise we do nothing, since it's already unset!
  return flags;
}
