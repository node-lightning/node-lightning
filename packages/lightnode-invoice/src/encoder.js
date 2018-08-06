const bech32 = require('./bech32');
const WordCursor = require('./word-cursor');
const crypto = require('./crypto');

module.exports = {
  encode,
  validate,
};

function validate(/*invoice */) {
  // check valid network
  // check valid amount
}

function encode(invoice, privKey) {
  validate(invoice);

  let writer = new WordCursor();

  let prefix = 'ln' + invoice.network + encodeAmount(invoice.amount);

  writer.writeUInt32BE(invoice.timestamp, 7);

  encodeData(invoice, writer);

  // generate sig data
  let sigData = bech32.convertWords(writer.words, 5, 8);
  sigData = Buffer.concat([Buffer.from(prefix, 'utf8'), Buffer.from(sigData)]);

  // generate sig hash
  let sigHash = crypto.sha256(sigData);

  //console.log(secp256k1.sign(sigHash, privKey));

  // sign this
  crypto.ecdsaSign(sigHash, privKey);

  return bech32.encode(prefix, writer.words);
}

function encodeAmount(/*amount */) {
  return '';
  // if (amount < 10 ** -9) return (amount * 10 ** 12).toFixed(0) + 'p';
  // if (amount < 10 ** -6) return (amount * 10 ** 9).toFixed(0) + 'n';
  // if (amount < 10 ** -3) return (amount * 10 ** 6).toFixed(0) + 'u';
  // if (amount < 0) return (amount * 10 ** 3).toFixed(0) + 'm';
  // return amount;
}

function encodeData(invoice, writer) {
  for (let datum of invoice.fields) {
    switch (datum.type) {
      case 1:
        writer.writeUInt32BE(datum.type, 1);
        writer.writeUInt32BE(52, 2);
        writer.writeBytes(datum.value);
        break;
      case 13:
        {
          let buf = Buffer.from(datum.value, 'utf8');
          let len = wordLen(buf);
          writer.writeUInt32BE(datum.type, 1);
          writer.writeUInt32BE(len, 2);
          writer.writeBytes(buf);
        }
        break;
    }
  }
}

function wordLen(buf) {
  return Math.ceil((buf.length * 8) / 5);
}
