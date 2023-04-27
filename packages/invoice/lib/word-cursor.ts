import { Bech32 } from "@node-lightning/bitcoin";

export class WordCursor {
    public words: number[];
    public position: number;

    constructor(words: number[] = []) {
        this.words = words;
        this.position = 0;
    }

    public get wordsRemaining(): number {
        return this.words.length - this.position;
    }

    public writeUIntBE(val: number, wordLen: number) {
        if (!wordLen) throw new Error("wordLen must be provided");
        const words = new Array(wordLen) as number[];
        const maxV = (1 << 5) - 1;
        for (let i = wordLen - 1; i >= 0; i--) {
            words[i] = val & maxV;
            val >>= 5;
        }
        this._merge(words);
    }

    public writeBytes(buf: Buffer, pad: boolean = true) {
        const words = Bech32.bufferToWords(buf, pad);
        this._merge(words);
    }

    public readUIntBE(numWords: number) {
        const words = this.words.slice(this.position, this.position + numWords);
        let val = 0;
        for (const word of words) {
            val <<= 5;
            val |= word;
        }
        this.position += numWords;
        return val;
    }

    public readBytes(numWords: number, pad: boolean = false) {
        const words = this.words.slice(this.position, this.position + numWords);
        this.position += numWords;
        return Buffer.from(Bech32.wordsToBuffer(words, pad));
    }

    private _merge(words: number[]) {
        this.words = this.words.concat(words);
    }
}
