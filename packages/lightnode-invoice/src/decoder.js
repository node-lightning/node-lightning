const crypto = require('crypto');
const elliptic = require('elliptic');
const bech32 = require('./bech32');
const BitCursor = require('./bit-cursor');

const ec = new elliptic.ec('secp256k1');

module.exports = {
  decode,
};

function decode(invoice) {
  let { prefix, words, bytes } = bech32.decode(invoice);

  let { network, amount } = parsePrefix(prefix);

  let reader = BitCursor.from(bytes);

  let timestamp = reader.readUIntBE(35); // read 35 bits
  let fields = [];
  let unknownFields = [];

  // read fields until at signature
  while (reader.bitsRemaining > 528) {
    let type = reader.readUIntBE(5); // read 5 bits
    let len = reader.readUIntBE(10) * 5; // read 10 bits, multiply by 5 for bits
    let data, rem;

    switch (type) {
      case 1: // p - 256-bit sha256 payment_hash
        data = reader.readBytes(len);
        break;
      case 9: // f - variable depending on version
        data = {
          version: reader.readUIntBE(5),
          address: reader.readBytes(len - 5),
        };
        break;
      case 19: // n - 33-byte public key of the payee node
        data = reader.readBytes(len);
        break;
      case 23: // h - 256-bit sha256 description of purpose of payment
        data = reader.readBytes(len);
        break;
      case 13: // d - short description of purpose of payment utf-8
        data = reader.readBytes(len).toString('utf8');
        break;
      case 6: // x - expiry time in seconds
      case 24: // c - min_final_cltv_expiry to use for the last HTLC in the route
        data = reader.readUIntBE(len);
        break;
      case 3: // r - variable, one or more entries containing extra routing info
        data = [];
        rem = len;
        while (rem >= 408) {
          data.push({
            pubkey: reader.readBits(264),
            short_channel_id: reader.readBits(64),
            fee_base_msat: reader.readUIntBE(32),
            fee_proportional_millionths: reader.readUIntBE(32),
            cltv_expiry_delta: reader.readUIntBE(16),
          });
          rem -= 408;
        }
        reader.readBits(rem);
        break;
      default:
        // ignore unknown fields
        unknownFields.push({ type, data: reader.readBits(len) });
        continue;
    }

    fields.push({ type, data });
  }

  let sigBytes = reader.readBits(512);
  let r = sigBytes.slice(0, 32);
  let s = sigBytes.slice(32);
  let recoveryFlag = reader.readUIntBE(8);

  reader.bitPosition = 0;
  let hashData = reader.readBits((words.length - 104) * 5);
  hashData = Buffer.concat([Buffer.from(prefix), hashData]);
  hashData = sha256(hashData);

  let pubkey = ec.recoverPubKey(hashData, { r, s }, recoveryFlag);

  // MUST validate signature
  if (!ec.keyFromPublic(pubkey).verify(hashData, { r, s })) throw new Error('Signature invalid');

  return {
    network,
    amount,
    timestamp,
    fields,
    unknownFields,
    signature: {
      r,
      s,
      recoveryFlag,
    },
    pubkey: {
      x: pubkey.getX().toBuffer('be'),
      y: pubkey.getY().toBuffer('be'),
    },
    hashData,
  };
}

//////////////

function sha256(data) {
  let hash = crypto.createHash('sha256');
  hash.update(data);
  return hash.digest();
}

function parsePrefix(prefix) {
  if (!prefix.startsWith('ln')) throw new Error('Invalid prefix');
  let network = '';
  let amount = '';
  let multiplier;
  let parsingNetwork = true;

  for (let i = 2; i < prefix.length; i++) {
    let charCode = prefix.charCodeAt(i);

    if (parsingNetwork) {
      if (charCode >= 97 && charCode <= 122) network += prefix[i];
      if (charCode >= 48 && charCode <= 57) parsingNetwork = false;
    }

    if (!parsingNetwork) {
      if (multiplier !== undefined) throw new Error('Invalid prefix');
      if (charCode >= 48 && charCode <= 57) amount += prefix[i];
      if (charCode >= 97 && charCode <= 122) multiplier = prefix[i];
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
  return network === 'bc' || network === 'tb' || network === 'crt';
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
