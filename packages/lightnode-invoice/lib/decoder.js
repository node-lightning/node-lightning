const BufferCursor = require('simple-buffer-cursor');
const crypto = require('./crypto');
const bech32 = require('./bech32');
const WordCursor = require('./word-cursor');
const Invoice = require('./invoice');

module.exports = {
  decode,
};

function decode(invoice) {
  let { prefix, words } = bech32.decode(invoice);

  let { network, amount } = parsePrefix(prefix);

  let wordcursor = new WordCursor(words);

  let timestamp = wordcursor.readUIntBE(7); // read 7 words / 35 bits

  let fields = [];
  let unknownFields = [];

  // read fields until at signature
  while (wordcursor.wordsRemaining > 104) {
    let type = wordcursor.readUIntBE(1); // read 1 word / 5 bits
    let len = wordcursor.readUIntBE(2); // read 2 words / 10 bits

    let value;

    switch (type) {
      case 1: // p - 256-bit sha256 payment_hash
        value = wordcursor.readBytes(len);
        break;
      case 3: // r - variable, one or more entries containing extra routing info
        {
          value = [];
          let bytes = wordcursor.readBytes(len);
          let bytecursor = BufferCursor.from(bytes);
          while (!bytecursor.eof) {
            value.push({
              pubkey: bytecursor.readBytes(33),
              short_channel_id: bytecursor.readBytes(8),
              fee_base_msat: bytecursor.readUInt32BE(),
              fee_proportional_millionths: bytecursor.readUInt32BE(),
              cltv_expiry_delta: bytecursor.readUInt16BE(),
            });
          }
        }
        break;
      case 6: // x - expiry time in seconds
        value = wordcursor.readUIntBE(len);
        break;
      case 9: // f - variable depending on version
        {
          let version = wordcursor.readUIntBE(1);
          let address = wordcursor.readBytes(len - 1);
          value = {
            version,
            address,
          };
          if (version !== 0 && version !== 17 && version !== 18) {
            unknownFields.push({ type, value });
            continue;
          }
        }
        break;
      case 13: // d - short description of purpose of payment utf-8
        value = wordcursor.readBytes(len).toString('utf8');
        break;
      case 19: // n - 33-byte public key of the payee node
        value = wordcursor.readBytes(len);
        break;
      case 23: // h - 256-bit sha256 description of purpose of payment
        value = wordcursor.readBytes(len);
        break;
      case 24: // c - min_final_cltv_expiry to use for the last HTLC in the route
        value = wordcursor.readUIntBE(len);
        break;
      default:
        // ignore unknown fields
        unknownFields.push({ type, value: wordcursor.readBytes(len) });
        continue;
    }

    fields.push({ type, value });
  }

  let sigBytes = wordcursor.readBytes(103); // read 512-bit sig
  let r = sigBytes.slice(0, 32);
  let s = sigBytes.slice(32);
  let recoveryFlag = wordcursor.readUIntBE(1);

  wordcursor.position = 0;
  let preHashData = wordcursor.readBytes(words.length - 104, true);
  preHashData = Buffer.concat([Buffer.from(prefix), preHashData]);
  let hashData = crypto.sha256(preHashData);

  // console.log(
  //   sigBytes.toString('hex'),
  //   recoveryFlag,
  //   preHashData.toString('hex'),
  //   hashData.toString('hex')
  // );

  // recovery pubkey from ecdsa sig
  let pubkey = crypto.ecdsaRecovery(hashData, sigBytes, recoveryFlag);

  // validate signature
  if (!crypto.ecdsaVerify(pubkey, hashData, sigBytes)) throw new Error('Signature invalid');

  let result = new Invoice();
  result.network = network;
  result.amount = amount;
  result.timestamp = timestamp;
  result.fields = fields;
  result.unknownFields = unknownFields;
  result.signature = {
    r,
    s,
    recoveryFlag,
  };
  result.pubkey = pubkey;
  result.hashData = hashData;
  return result;
}

//////////////

function parsePrefix(prefix) {
  if (!prefix.startsWith('ln')) throw new Error('Invalid prefix');
  let network = '';
  let amount = '';
  let multiplier;
  let hasNetwork = false;
  let hasAmount = false;

  for (let i = 2; i < prefix.length; i++) {
    let charCode = prefix.charCodeAt(i);

    if (!hasNetwork) {
      if (charCode >= 97 && charCode <= 122) network += prefix[i];
      else hasNetwork = true;
    }

    if (hasNetwork && !hasAmount) {
      if (charCode >= 48 && charCode <= 57) amount += prefix[i];
      else if (amount) hasAmount = true;
      else throw new Error('Invalid amount');
    }

    if (hasAmount) {
      if (charCode >= 97 && charCode <= 122) multiplier = prefix[i];
      else throw new Error('Invalid character');
    }
  }

  amount = amount === '' ? null : parseInt(amount) * getAmountMultiplier(multiplier);

  if (!isValidNetwork(network)) throw new Error('Invalid network');
  if (!isValidAmount(amount)) throw new Error('Invalid amount');

  return {
    network,
    amount,
  };
}

function isValidNetwork(network) {
  return network === 'bc' || network === 'tb' || network === 'bcrt' || network === 'sb';
}

function isValidAmount(amount) {
  return amount === null || amount > 0;
}

function getAmountMultiplier(char) {
  if (char === undefined) return 1;
  let units = {
    m: 10 ** -3,
    u: 10 ** -6,
    n: 10 ** -9,
    p: 10 ** -12,
  };
  if (units[char]) return units[char];
  throw new Error('Invalid multiplier');
}
