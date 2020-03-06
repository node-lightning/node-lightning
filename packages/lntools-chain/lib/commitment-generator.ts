import { sha256 } from "@lntools/crypto";

// note we will need to use bignumber.js because we can't do bitmath over 2**32
export function generateFromSeed(seed: Buffer, i: number): Buffer {
  const ibn = BigInt(i);
  let p = seed;
  for (let b = 47; b >= 0; b--) {
    if ((ibn & (BigInt(2) ** BigInt(b))) > BigInt(0)) {
      // since p is a buffer...
      //  read least significant int64 value
      //  flip via int64 ^ 2**b
      //  write back to buffer at least significant portion

      // alternative, can calculate the byte index and flip appropriate bit inside appropriate byte
      const byteIndex = Math.floor(b / 8);
      const bitIndex = b % 8;

      // flip the specified bit in the specific byte
      p[byteIndex] = p[byteIndex] ^ (2 ** bitIndex);

      // console.log(`flipping ${b} on byte ${byteIndex} bit ${bitIndex}`);

      p = sha256(p);
    }
  }
  return p;
}
