const BufferCursor = require('simple-buffer-cursor');
const bech32 = require('bech32');
const crypto = require('./crypto');
const WordCursor = require('./word-cursor');
const Invoice = require('./invoice');
const Decimal = require('decimal.js');
const { FIELD_TYPE, ADDRESS_VERSION } = require('./constants');

module.exports = {
  decode,
};

/**
 * Decodes an invoice into an Invoice object
 * @param {String} invoice
 * @return {Invoice}
 */
function decode(invoice) {
  // Decode the invoice into prefix and words.
  // The words will be interated over to decode the rest of thee invoice
  let { prefix, words } = bech32.decode(invoice, Number.MAX_SAFE_INTEGER);

  // Parse the prefix into the network and the amount.
  let { network, amount } = parsePrefix(prefix);

  // Construct a word cursor to read from the remaining data
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
      case FIELD_TYPE.PAYMENT_HASH: // p - 256-bit sha256 payment_hash
        value = wordcursor.readBytes(len);
        break;
      case FIELD_TYPE.ROUTE: // r - variable, one or more entries containing extra routing info
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
      case FIELD_TYPE.EXPIRY: // x - expiry time in seconds
        value = wordcursor.readUIntBE(len);
        break;
      case FIELD_TYPE.FALLBACK_ADDRESS: // f - variable depending on version
        {
          let version = wordcursor.readUIntBE(1);
          let address = wordcursor.readBytes(len - 1);
          value = {
            version,
            address,
          };
          if (
            version !== ADDRESS_VERSION.SEGWIT &&
            version !== ADDRESS_VERSION.P2PKH &&
            version !== ADDRESS_VERSION.P2SH
          ) {
            unknownFields.push({ type, value });
            continue;
          }
        }
        break;
      case FIELD_TYPE.SHORT_DESC: // d - short description of purpose of payment utf-8
        value = wordcursor.readBytes(len).toString('utf8');
        break;
      case FIELD_TYPE.PAYEE_NODE: // n - 33-byte public key of the payee node
        value = wordcursor.readBytes(len);
        break;
      case FIELD_TYPE.HASH_DESC: // h - 256-bit sha256 description of purpose of payment
        value = wordcursor.readBytes(len);
        break;
      case FIELD_TYPE.MIN_FINAL_CLTV_EXPIRY: // c - min_final_cltv_expiry to use for the last HTLC in the route
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

  // recovery pubkey from ecdsa sig
  let pubkey = crypto.ecdsaRecovery(hashData, sigBytes, recoveryFlag);

  // validate signature
  if (!crypto.ecdsaVerify(pubkey, hashData, sigBytes)) throw new Error('Signature invalid');

  let result = new Invoice();
  result.network = network;
  result.value = amount;
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

  amount = amount === '' ? null : new Decimal(amount).mul(getAmountMultiplier(multiplier));

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
    m: 1e-3,
    u: 1e-6,
    n: 1e-9,
    p: 1e-12,
  };
  if (units[char]) return units[char];
  throw new Error('Invalid multiplier');
}
