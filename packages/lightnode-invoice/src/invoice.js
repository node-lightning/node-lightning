class Invoice {
  constructor({ network, amount, timestamp, fields, unknownFields, signature, pubkey, hashData }) {
    this.network = network;
    this.amount = amount;
    this.timestamp = timestamp;
    this.fields = fields;
    this.unknownFields = unknownFields;
    this.signature = signature;
    this.pubkey = pubkey;
    this.hashData = hashData;

    this.expiry = this._getFieldValue(6, 3600);
    this.paymentHash = this._getFieldValue(1);
    this.shortDesc = this._getFieldValue(13);
    this.hashDesc = this._getFieldValue(23);
    this.payeeNode = this._getFieldValue(19);
    this.minFinalCltvExpiry = this._getFieldValue(24, 9);
    this.fallbackAddresses = this.fields.filter(p => p.type === 9).map(p => p.value);
    this.routes = this.fields.filter(p => p.type === 3).map(p => p.value);
  }

  _getFieldValue(type, def) {
    let field = this.fields.filter(p => p.type === type)[0];
    return field ? field.value : def;
  }
}

module.exports = Invoice;
