const bs58check = require('bs58check');
const bech32 = require('bech32');
const crypto = require('./crypto');
const BN = require('bn.js');
const { FIELD_TYPE, FIELD_DEFAULT, ADDRESS_VERSION } = require('./constants');

const picoToMsat = 10;
const picoToSat = picoToMsat * 1000;
const picoToBtc = 1e12;
const MAX_SHORT_DESC_BYTES = 639;

class Invoice {
  /**
    Invoice is the state container used for invoice data. It is used
    when building an invoice or contains the results from decoded
    invoices. The Invoice type does not perform validation on
    data it contains but does contain helper methods to help
    construct proper invoices.
  */
  constructor() {
    /** @type {BN} */
    this._value; // value stores in pico bitcoin

    this.network = null;

    this.timestamp = null;
    this.fields = [];
    this.unknownFields = [];

    this.signature = null;
    this.pubkey = null;
    this.hashData = null;
    this.usedSigRecovery = false;
  }

  /**
    Returns true when the invoice has a value
    associated with it. Invoices may optionally contain a value.
    When there is no value, the invoice is for the receipt of
    any value.

    @type boolean
   */
  get hasValue() {
    return this._value instanceof BN;
  }

  /**
    Warning: there is the possibility of precision loss!

    Gets the value in bitcoin as a string by converting from pico btc
    into bitcoin. Returns null if the invoice has no amount.

    Sets the value from a number or string that represeents a bitcoin
    value, such as 0.0001 to represent 10000 satoshi. Setting a falsy
    value will remove the value from the invoice.

    @deprecated This property is maintained for backwards compaibility.
    Use property `valueSat` or `valueMsat` instead.

    @type string
   */
  get amount() {
    return this.hasValue ? (this._value.toNumber() / picoToBtc).toFixed(11) : null;
  }

  set amount(val) {
    if (!val) this._value = null;
    else this._value = new BN(parseFloat(val) * picoToBtc);
  }

  /**
    Warning: Msat fractions are truncated!

    Gets the value in satoshi as a string by converting from pico btc
    into satoshi. Returns null if the invoice has no amount.

    Sets the value in satoshi from a string or number, such as 10000 satoshi.
    Setting a falsy value will remove the value from the invoice.

    @type string
   */
  get valueSat() {
    return this.hasValue ? this._value.divn(picoToSat).toString() : null;
  }

  set valueSat(val) {
    if (!val) this._value = null;
    else this._value = new BN(val).muln(picoToSat);
  }

  /**
    Gets the value in milli-sataoshi as a string or returns null
    if the invoice has no amount.

    Sets the value in millisatoshi from a string or number. Setting a falsy
    value will remove the value from the invoice.

    @type string
   */
  get valueMsat() {
    return this.hasValue ? this._value.divn(picoToMsat).toString() : null;
  }

  set valueMsat(val) {
    if (!val) this._value = null;
    else this._value = new BN(val).muln(picoToMsat);
  }

  /**
    Get the expiry time for the invoice as a big endian number
    of seconds. The defualt is one hour (3600).

    Sets the expiry time in seconds for the invoice.  Only a single
    expiry field is valid in the invoice.

    @type number
   */
  get expiry() {
    return this._getFieldValue(FIELD_TYPE.EXPIRY, FIELD_DEFAULT.EXPIRY);
  }

  set expiry(value) {
    this._setFieldValue(FIELD_TYPE.EXPIRY, value);
  }

  /**
    Gets the 256-bit payment hash. The preimage of this value
    will provide proof of payment.

    Sets the 256-bit payment hash for the invoice from a Buffer
    or hex-encoded string. Only a single field of this type is
    valid in the invoice.

    @type Buffer
   */
  get paymentHash() {
    return this._getFieldValue(FIELD_TYPE.PAYMENT_HASH);
  }

  set paymentHash(value) {
    if (typeof value === 'string') value = Buffer.from(value, 'hex');
    this._setFieldValue(FIELD_TYPE.PAYMENT_HASH, value);
  }

  /**
    Gets the description as either a shortDesc or hashDesc
    value. If it is the former it is returned as a string.
    hashDesc is returned as a buffer of the hash.

    Sets the description for the invoice. An invoice must use hash
    description for messages longer than 639 bytes. If the string is
    longer than 639 bytes, the description will be hashed and stored
    in hashDesc. Otherwise, the raw string will be stored in the
    short desc.

    @type string | Buffer
   */
  get desc() {
    return this.shortDesc || this.hashDesc;
  }

  set desc(desc) {
    let len = Buffer.byteLength(desc);
    if (len > MAX_SHORT_DESC_BYTES) this.hashDesc = crypto.sha256(desc);
    else this.shortDesc = desc;
  }

  /**
    Gets the short description text. Returns null when the invoice
    does not contain a short description. An invoice must set
    either a short description or a hash description.

    Sets the short description text. Maximum valid length is 639
    bytes. Only a single short desc or hash desc field is allowed.
    Setting this field will remove the hashDesc field value.

    @type string
   */
  get shortDesc() {
    return this._getFieldValue(FIELD_TYPE.SHORT_DESC);
  }

  set shortDesc(value) {
    this._removeFieldByType(FIELD_TYPE.HASH_DESC);
    this._setFieldValue(FIELD_TYPE.SHORT_DESC, value);
  }

  /**
    Gets the 256-bit hash of the description. Returns
    null when an invoice does not contain a hash description.
    An invoice must contain either a shortDesc or hashDesc.

    Sets the hash description to the hex-encoded string or
    Buffer containing the the hashed description.
    This must be used for descriptions that are over 639 bytes
    long. Setting this field will remove any short desc fields.

    @type Buffer
   */
  get hashDesc() {
    return this._getFieldValue(FIELD_TYPE.HASH_DESC);
  }

  set hashDesc(value) {
    if (typeof value === 'string') value = Buffer.from(value, 'hex');
    this._removeFieldByType(FIELD_TYPE.SHORT_DESC);
    this._setFieldValue(FIELD_TYPE.HASH_DESC, value);
  }

  /**
    Gets the 33-byte public key of the payee node. This is
    used to explicitly describe the payee node instead of
    relying on pub key recovery from the signature.

    Sets the 33-byte public key of the payee node. This is
    used to set the public key explicitly instead of relying
    on signature recovery. This field must match the pubkey
    used to generate the signature.

    @type Buffer
   */
  get payeeNode() {
    return this._getFieldValue(FIELD_TYPE.PAYEE_NODE);
  }

  set payeeNode(value) {
    if (typeof value === 'string') value = Buffer.from(value, 'hex');
    this._setFieldValue(FIELD_TYPE.PAYEE_NODE, value);
  }

  /**
    Gets the min final route CLTV expiry. If none is provided,
    the default is 9.

    Sets the min final route CLTV expiry used in the final route.

    @type number
   */
  get minFinalCltvExpiry() {
    return this._getFieldValue(
      FIELD_TYPE.MIN_FINAL_CLTV_EXPIRY,
      FIELD_DEFAULT.MIN_FINAL_CLTV_EXPIRY
    );
  }

  set minFinalCltvExpiry(value) {
    this._setFieldValue(FIELD_TYPE.MIN_FINAL_CLTV_EXPIRY, value);
  }

  /**
    Gets a list of fall back addresses. An invoice can include
    multiple fallback addresses to send to an on-chain address
    in the event of failure.

    @type
      [{
        version: number,
        address: Buffer
      }]
   */
  get fallbackAddresses() {
    return this.fields.filter(p => p.type === FIELD_TYPE.FALLBACK_ADDRESS).map(p => p.value);
  }

  /**
    Adds a fallback address to the invoice. An invoice can include
    one or more fallback addresses to send to an on-chain address
    in the event of failure. This field may not make sense for small
    or time-sensitive payments.

    The address string will be parsed and the appropriate address
    type is added to the field metadata. The address will be
    converted into a buffer containing the string values of the
    address.

    @param {string} addrStr
   */
  addFallbackAddress(addrStr) {
    let version, address;
    // TODO - externalize magic strings!!!
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
    Gets the list of routes that are specified in the invoice.
    Route information is necessary to route payments to private
    nodes.

    @type [{
      pubkey: Buffer,
      short_channel_id: Buffer,
      fee_base_msat: number,
      fee_proportional_millionths: number,
      cltv_expiry_delta: number
    }]
   */
  get routes() {
    return this.fields.filter(p => p.type === FIELD_TYPE.ROUTE).map(p => p.value);
  }

  /**
    Adds a collection of routes to the invoice. A route entry must
    be provided by private nodes so that a public addressible node
    can be found by the recipient.

    Multiple route fields can be added to an invoice in according
    with BOLT 11 to give the routing options.

    @param {
      [{
        pubkey: Buffer,
        short_channel_id: Buffer,
        fee_base_msat: number,
        fee_proportional_millionths: number,
        cltv_expiry_delta: number
      }]
    } routes array of route objects

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
    type. If no result is found, the default value will be used.

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
