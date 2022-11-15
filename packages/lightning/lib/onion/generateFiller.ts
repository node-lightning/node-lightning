import * as crypto from "@node-lightning/crypto";
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
        const slice = filler.slice(hopSize);
        filler = Buffer.alloc(fillerSize); // create zero fille
        slice.copy(filler); // copy sliced values

        // generate pseudo-random byte stream
        const streamKey = generateKey(key, sharedSecrets[i]);
        const streamBytes = generateCipherStream(streamKey, fillerSize);

        // obfuscate the filler using xor
        filler = crypto.xor(filler, streamBytes);
    }

    return filler.slice((maxNumHops - numHops + 2) * hopSize);
}
