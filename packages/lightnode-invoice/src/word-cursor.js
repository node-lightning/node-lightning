const bech32 = require('./bech32');

class WordCursor {
  constructor(words = []) {
    this.words = words;
    this.position = 0;
  }

  _merge(words) {
    this.words = this.words.concat(words);
  }

  writeUInt32BE(val, wordLen) {
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
}

module.exports = WordCursor;
