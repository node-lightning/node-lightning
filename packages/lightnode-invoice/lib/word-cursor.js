const bech32 = require('./bech32');

class WordCursor {
  constructor(words = []) {
    this.words = words;
    this.position = 0;
  }

  get wordsRemaining() {
    return this.words.length - this.position;
  }

  _merge(words) {
    this.words = this.words.concat(words);
  }

  writeUIntBE(val, wordLen) {
    let words = new Array(wordLen);
    let maxV = (1 << 5) - 1;
    for (let i = wordLen - 1; i >= 0; i--) {
      words[i] = val & maxV;
      val >>= 5;
    }
    this._merge(words);
  }

  writeBytes(buf) {
    let words = bech32.convertWords(buf, 8, 5, true);
    this._merge(words);
  }

  readUIntBE(numWords) {
    let words = this.words.slice(this.position, this.position + numWords);
    let val = 0;
    for (let word of words) {
      val <<= 5;
      val |= word;
    }
    this.position += numWords;
    return val;
  }

  readBytes(numWords, pad = false) {
    let words = this.words.slice(this.position, this.position + numWords);
    this.position += numWords;
    return Buffer.from(bech32.convertWords(words, 5, 8, pad));
  }
}

module.exports = WordCursor;
