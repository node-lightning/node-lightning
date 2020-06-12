import * as crypto from "@lntools/crypto";

export function generateFiller(padkey: Buffer, numHops: number, hopSize: number): Buffer {
    const maxNumHops = 20;
    const fillerSize = (maxNumHops + 1) * hopSize;

    // generate pseudo-random byte stream
    const iv = Buffer.alloc(16);
    const data = Buffer.alloc(fillerSize);
    const streamBytes = crypto.chachaEncrypt(padkey, iv, data);

    // initial creation of filler
    let filler = Buffer.alloc(fillerSize);

    // Iterate until the penultimate hop, since the last hop is not obfuscated
    for (let i = 0; i < numHops - 1; i++) {
        // left shift the filler
        filler = filler.slice(hopSize);

        // zero-fill the last hop
        const zeros = Buffer.alloc(hopSize);
        zeros.copy(filler, filler.length - hopSize);

        // obfuscate the filler using xor
        filler = crypto.xor(filler, streamBytes);
    }

    // cut filler down to correct length
    return filler.slice((maxNumHops - numHops + 2) * hopSize);
}
