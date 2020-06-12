import * as crypto from "@lntools/crypto";
import { generateCipherStream } from "./generateCipherStream";
import { generateKey } from "./generateKey";
import { KeyType } from "./KeyType";

export function generateFiller(
    key: KeyType,
    numHops: number,
    hopSize: number,
    sharedSecrets: Buffer[],
): Buffer {
    const maxNumHops = 20;
    const fillerSize = (maxNumHops + 1) * hopSize;
    let filler = Buffer.alloc(fillerSize);

    // Iterate until the penultimate hop, since the last hop is not obfuscated
    for (let i = 0; i < numHops - 1; i++) {
        // left shift the filler
        filler = filler.slice(hopSize);

        // zero-fill the last hop
        const zeros = Buffer.alloc(hopSize);
        zeros.copy(filler, filler.length - hopSize);

        // generate pseudo-random byte stream
        const streamKey = generateKey(key, sharedSecrets[i]);
        const streamBytes = generateCipherStream(streamKey, fillerSize);

        // obfuscate the filler using xor
        filler = crypto.xor(filler, streamBytes);
    }

    // cut filler down to correct length
    return filler.slice((maxNumHops - numHops + 2) * hopSize);
}
