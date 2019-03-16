const bs58check = require('bs58check');
const bech32 = require('bech32');
const crypto = require('./crypto');

class Invoice {
  constructor() {
    this.network;
    this.amount;
    this.timestamp;
    this.fields = [];
    this.unknownFields = [];

    this.signature;
    this.pubkey;
    this.hashData;
  }

  _getFieldValue(type, def) {
    let field = this.fields.find(p => p.type === type);
    return field ? field.value : def;
  }

  _setFieldValue(type, value) {
    let field = this.fields.find(p => p.type === type);
    if (field) field.value = value;
    else this.fields.push({ type, value });
  }

  get expiry() {
    return this._getFieldValue(6, 3600);
  }

  get paymentHash() {
    return this._getFieldValue(1);
  }

  get shortDesc() {
    return this._getFieldValue(13);
  }

  get hashDesc() {
    return this._getFieldValue(23);
  }

  get payeeNode() {
    return this._getFieldValue(19);
  }

  get minFinalCltvExpiry() {
    return this._getFieldValue(24, 9);
  }

  get fallbackAddresses() {
    return this.fields.filter(p => p.type === 9).map(p => p.value);
  }

  get routes() {
    return this.fields.filter(p => p.type === 3).map(p => p.value);
  }

  set expiry(value) {
    this._setFieldValue(6, value);
  }

  set paymentHash(value) {
    if (typeof value === 'string') value = Buffer.from(value, 'hex');
    this._setFieldValue(1, value);
  }

  set shortDesc(value) {
    this._setFieldValue(13, value);
  }

  set hashDesc(value) {
    if (typeof value === 'string') value = crypto.sha256(value);
    this._setFieldValue(23, value);
  }

  set payeeNode(value) {
    if (typeof value === 'string') value = Buffer.from(value, 'hex');
    this._setFieldValue(19, value);
  }

  set minFinalCltvExpiry(value) {
    this._setFieldValue(24, value);
  }

  addFallbackAddress(addrStr) {
    let version, address;
    if (addrStr.startsWith('1') || addrStr.startsWith('m') || addrStr.startsWith('n')) {
      version = 17;
      address = bs58check.decode(addrStr).slice(1); // remove prefix
    } else if (addrStr.startsWith('3') || addrStr.startsWith('2')) {
      version = 18;
      address = bs58check.decode(addrStr).slice(1); // remove prefix
    } else if (addrStr.startsWith('bc1') || addrStr.startsWith('tb1')) {
      let words = bech32.decode(addrStr).words;
      version = words[0];
      address = bech32.fromWords(words.slice(1));
    }
    if (Array.isArray(address)) address = Buffer.from(address);
    this.fields.push({ type: 9, value: { version, address } });
  }

  addRoute(routes) {
    for (let route of routes) {
      if (typeof route.pubkey === 'string') route.pubkey = Buffer.from(route.pubkey, 'hex');
      if (typeof route.short_channel_id === 'string')
        route.short_channel_id = Buffer.from(route.short_channel_id, 'hex');
    }
    this.fields.push({ type: 3, value: routes });
  }
}

module.exports = Invoice;
