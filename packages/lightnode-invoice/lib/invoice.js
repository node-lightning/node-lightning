const bs58check = require('bs58check');
const bech32 = require('bech32');
const BN = require('bn.js');
const { FIELD_TYPE, FIELD_DEFAULT, ADDRESS_VERSION } = require('./constants');

const picoToMsat = 10;
const picoToSat = picoToMsat * 1000;
const picoToBtc = 1e12;

class Invoice {
  constructor() {
    this.network;

    /** @type {BN} */
    this._value; // value stores in pico bitcoin

    this.timestamp;
    this.fields = [];
    this.unknownFields = [];

    this.signature;
    this.pubkey;
    this.hashData;
  }

  /**
   * Returns true if a value has been set for the invoice
   * @returns {boolean}
   */
  get hasValue() {
    return this._value instanceof BN;
  }

  /**
    Warning: there is the possibility of precision loss!

    Gets the value in bitcoin as a string by converting from msat
    into bitcoin.

    This function is maintained for backwards compaibility and is
    deprecated. Use `value` which uses satoshi by default.

    @deprecated Use `value`
    @return {string} value in bitcoin
   */
  get amount() {
    return this.hasValue ? (this._value.toNumber() / picoToBtc).toFixed(11) : null;
  }

  /**
    Sets the value in bitcoin
    @deprecated Use `value` instead
    @param {number|string} val
   */
  set amount(val) {
    if (!val) this._value = null;
    else this._value = new BN(parseFloat(val) * picoToBtc);
  }

  /**
    Gets the value in satoshi as a strings. Msat fractions are truncated.

    @return {string}
   */
  get valueSat() {
    return this.hasValue ? this._value.divn(picoToSat).toString() : null;
  }

  /**
    Sets the value in satoshi from a string or number

    @param {string|number} val
   */
  set valueSat(val) {
    if (!val) this._value = null;
    else this._value = new BN(val).muln(picoToSat);
  }

  /**
    Gets the value in millisataoshi as a string

    @return {string}
   */
  get valueMsat() {
    return this.hasValue ? this._value.divn(picoToMsat).toString() : null;
  }

  /**
    Sets the value in millisatoshi

    @param {number|string} val
   */
  set valueMsat(val) {
    if (!val) this._value = null;
    else this._value = new BN(val).muln(picoToMsat);
  }

  /**
   * Get the expiry time, defualt is 9
   * @returns {number}
   */
  get expiry() {
    return this._getFieldValue(FIELD_TYPE.EXPIRY, FIELD_DEFAULT.EXPIRY);
  }

  /**
   * Sets the expiry time
   * @param {number} the expiry time
   */
  set expiry(value) {
    this._setFieldValue(FIELD_TYPE.EXPIRY, value);
  }

  /**
   * Gets the payment hash
   * @returns {Buffer} 32-byte buffer of the payment hash
   */
  get paymentHash() {
    return this._getFieldValue(FIELD_TYPE.PAYMENT_HASH);
  }

  /**
   * Sets the payment hash
   * @param {string|Buffer} value hex encoded striing of Buffeer
   */
  set paymentHash(value) {
    if (typeof value === 'string') value = Buffer.from(value, 'hex');
    this._setFieldValue(FIELD_TYPE.PAYMENT_HASH, value);
  }

  /**
    Gets the short description text.

    @return {string}
   */
  get shortDesc() {
    return this._getFieldValue(FIELD_TYPE.SHORT_DESC);
  }

  /**
    Sets the short description text. Maximum valid length is 639 bytes.
    Only a single short desc or hash desc field is allowed.

    Setting this field will remove any hash desc fields.

    @param {string} value
   */
  set shortDesc(value) {
    this._removeFieldByType(FIELD_TYPE.HASH_DESC);
    this._setFieldValue(FIELD_TYPE.SHORT_DESC, value);
  }

  /**
    Gets the 32-byte hash of the description.

    @return {Buffer}
   */
  get hashDesc() {
    return this._getFieldValue(FIELD_TYPE.HASH_DESC);
  }

  /**
    Sets the hash description to the string or hex-encoded
    Buffer provided. This must be used for descriptions
    that are over 639 bytes long.

    Setting this field will remove any short desc fields.

    @param {string|Buffer} value string hash value or Buffer
   */
  set hashDesc(value) {
    if (typeof value === 'string') value = Buffer.from(value, 'hex');
    this._removeFieldByType(FIELD_TYPE.SHORT_DESC);
    this._setFieldValue(FIELD_TYPE.HASH_DESC, value);
  }

  /**
   * Gets the 33-byte public key of the payee node.
   * @returns {Buffer}
   */
  get payeeNode() {
    return this._getFieldValue(FIELD_TYPE.PAYEE_NODE);
  }

  /**
   * Sets the 33-byte public key of the payee node
   * @param {string|Buffer} value hex-encoded string or buffer
   */
  set payeeNode(value) {
    if (typeof value === 'string') value = Buffer.from(value, 'hex');
    this._setFieldValue(FIELD_TYPE.PAYEE_NODE, value);
  }

  /**
   * Gets the min final route CLTV expiry. Default is 9.
   * @returns {number}
   */
  get minFinalCltvExpiry() {
    return this._getFieldValue(
      FIELD_TYPE.MIN_FINAL_CLTV_EXPIRY,
      FIELD_DEFAULT.MIN_FINAL_CLTV_EXPIRY
    );
  }

  /**
   * Sets the min final route CLTV expiry.
   * @param {number} value
   */
  set minFinalCltvExpiry(value) {
    this._setFieldValue(FIELD_TYPE.MIN_FINAL_CLTV_EXPIRY, value);
  }

  /**
   * Gets a list of fall back addresses
   * @returns {[Object<number,Buffer>]}
   */
  get fallbackAddresses() {
    return this.fields.filter(p => p.type === FIELD_TYPE.FALLBACK_ADDRESS).map(p => p.value);
  }

  /**
   * Adds a fallback address
   * @param {string} addrStr
   */
  addFallbackAddress(addrStr) {
    let version, address;
    if (addrStr.startsWith('1') || addrStr.startsWith('m') || addrStr.startsWith('n')) {
      version = ADDRESS_VERSION.P2PKH;
      address = bs58check.decode(addrStr).slice(1); // remove prefix
    } else if (addrStr.startsWith('3') || addrStr.startsWith('2')) {
      version = ADDRESS_VERSION.P2SH;
      address = bs58check.decode(addrStr).slice(1); // remove prefix
    } else if (addrStr.startsWith('bc1') || addrStr.startsWith('tb1')) {
      let words = bech32.decode(addrStr).words;
      version = words[0];
      address = bech32.fromWords(words.slice(1));
    }
    if (Array.isArray(address)) address = Buffer.from(address);
    this.fields.push({ type: FIELD_TYPE.FALLBACK_ADDRESS, value: { version, address } });
  }

  /**
   * Gets the list of routes
   */
  get routes() {
    return this.fields.filter(p => p.type === FIELD_TYPE.ROUTE).map(p => p.value);
  }

  /**
   * Adds a collection of routes to the invoice
   * @param {[Object]} route
   */
  addRoute(routes) {
    for (let route of routes) {
      if (typeof route.pubkey === 'string') route.pubkey = Buffer.from(route.pubkey, 'hex');
      if (typeof route.short_channel_id === 'string')
        route.short_channel_id = Buffer.from(route.short_channel_id, 'hex');
    }
    this.fields.push({ type: FIELD_TYPE.ROUTE, value: routes });
  }

  ///////////////////////////////////////////////////////////////////

  /**
    Gets the value of thee first matching field that matches the field
    type. If no result is found, the default value will used
    @private
    @param {number} type the field type
    @param {any} def default value
   */
  _getFieldValue(type, def) {
    let field = this.fields.find(p => p.type === type);
    return field ? field.value : def;
  }

  /**
    Sets the field value for the first matching field. If no
    field exists it will insert a new field with the type and value
    supplied.
    @param {number} type the field type
    @param {any} value the field value
   */
  _setFieldValue(type, value) {
    let field = this.fields.find(p => p.type === type);
    if (field) field.value = value;
    else this.fields.push({ type, value });
  }

  /**
    Removes the fields that match the supplied type.
    @param {number} type the field value
   */
  _removeFieldByType(type) {
    this.fields = this.fields.filter(p => p.type !== type);
  }
}

module.exports = Invoice;
