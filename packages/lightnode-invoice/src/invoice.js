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

  static create({
    network,
    amount,
    timestamp,
    fields,
    unknownFields,
    signature,
    pubkey,
    hashData,
  }) {
    let i = new Invoice();
    i.network = network;
    i.amount = amount;
    i.timestamp = timestamp;
    i.fields = fields;
    i.unknownFields = unknownFields;
    i.signature = signature;
    i.pubkey = pubkey;
    i.hashData = hashData;
    return i;
  }

  _getFieldValue(type, def) {
    let field = this.fields.filter(p => p.type === type)[0];
    return field ? field.value : def;
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
}

module.exports = Invoice;
