const bech32 = require('bech32');
const BitCursor = require('./bit-cursor');

module.exports = {
  decode,
};

function decode(paymentInvoice) {
  let { prefix, words } = bech32.decode(paymentInvoice, 1023);
  let buffer = convertWords(words, 5, 8);

  let { network, amount } = parsePrefix(prefix);

  let reader = BitCursor.from(buffer);

  let timestamp = reader.readUIntBE(35); // read 35 bits
  let dataSections = [];

  // read data until at signature
  while (reader.bitsRemaining > 520) {
    let type = reader.readUIntBE(5); // read 5 bits
    let len = reader.readUIntBE(10) * 5; // read 10 bits, multiply by 5 for bits
    let data, rem;

    switch (type) {
      case 1: // p - 256-bit sha256 payment_hash
        data = reader.readBits(len, true);
        break;
      case 9: // f - variable depending on version
        data = {
          version: reader.readUIntBE(5),
          address: reader.readBits(len - 5, true),
        };
        break;
      case 19: // n - 33-byte public key of the payee node
        data = reader.readBits(len, true);
        break;
      case 23: // h - 256-bit sha256 description of purpose of payment
        data = reader.readBits(len, true);
        break;
      case 13: // d - short description of purpose of payment utf-8
        data = reader.readBits(len, true).toString('utf8');
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
        throw new Error('invalid data type ' + type);
    }

    dataSections.push({ type, data });
  }

  let signature = reader.readBits(520);

  return {
    network,
    amount,
    timestamp,
    data: dataSections,
    signature,
  };
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
  return network === 'bc' || network === 'tb' || network === 'crt';
}

function isValidAmount(amount) {
  return amount === null || amount > 0;
}

function getAmountMultiplier(char) {
  if (char === undefined) return 1;
  if (char === 'm') return 0.001;
  if (char === 'u') return 0.000001;
  if (char === 'n') return 0.000000001;
  if (char === 'p') return 0.000000000001;
  throw new Error('Invalid multiplier');
}

function convertWords(data, inBits, outBits) {
  var value = 0;
  var bits = 0;
  var maxV = (1 << outBits) - 1;

  var result = [];
  for (var i = 0; i < data.length; ++i) {
    value = (value << inBits) | data[i];
    bits += inBits;

    while (bits >= outBits) {
      bits -= outBits;
      result.push((value >> bits) & maxV);
    }
  }

  return result;
}
