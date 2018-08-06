const crypto = require('./crypto');
const bech32 = require('./bech32');
const bitcursor = require('./bit-cursor');
const Invoice = require('./invoice');

module.exports = {
  decode,
};

function decode(invoice) {
  let { prefix, words, bytes } = bech32.decode(invoice);

  let { network, amount } = parsePrefix(prefix);

  let reader = bitcursor.from(bytes);

  let timestamp = reader.readUIntBE(35); // read 35 bits
  let fields = [];
  let unknownFields = [];

  // read fields until at signature
  while (reader.bitsRemaining > 528) {
    let type = reader.readUIntBE(5); // read 5 bits
    let len = reader.readUIntBE(10) * 5; // read 10 bits, multiply by 5 for bits
    let value, rem;

    switch (type) {
      case 1: // p - 256-bit sha256 payment_hash
        value = reader.readBytes(len);
        break;
      case 9: // f - variable depending on version
        {
          let version = reader.readUIntBE(5);
          let address = reader.readBytes(len - 5);
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
      case 19: // n - 33-byte public key of the payee node
        value = reader.readBytes(len);
        break;
      case 23: // h - 256-bit sha256 description of purpose of payment
        value = reader.readBytes(len);
        break;
      case 13: // d - short description of purpose of payment utf-8
        value = reader.readBytes(len).toString('utf8');
        break;
      case 6: // x - expiry time in seconds
      case 24: // c - min_final_cltv_expiry to use for the last HTLC in the route
        value = reader.readUIntBE(len);
        break;
      case 3: // r - variable, one or more entries containing extra routing info
        value = [];
        rem = len;
        while (rem >= 408) {
          value.push({
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
        unknownFields.push({ type, value: reader.readBits(len) });
        continue;
    }

    fields.push({ type, value });
  }

  let sigBytes = reader.readBits(512);
  let r = sigBytes.slice(0, 32);
  let s = sigBytes.slice(32);
  let recoveryFlag = reader.readUIntBE(8);

  reader.bitPosition = 0;
  let hashData = reader.readBits((words.length - 104) * 5);
  hashData = Buffer.concat([Buffer.from(prefix), hashData]);
  hashData = crypto.sha256(hashData);

  // recovery pubkey from ecdsa sig
  let pubkey = crypto.ecdsaRecovery(hashData, sigBytes, recoveryFlag);

  // validate signature
  if (!crypto.ecdsaVerify(pubkey, hashData, sigBytes)) throw new Error('Signature invalid');

  return Invoice.create({
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
    pubkey,
    hashData,
  });
}

//////////////

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
  return network === 'bc' || network === 'tb' || network === 'crt' || network === 'sb';
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
