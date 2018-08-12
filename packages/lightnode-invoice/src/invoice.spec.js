const Invoice = require('./invoice');

let sut;
beforeEach(() => {
  sut = new Invoice();
});

describe('general', () => {
  test('it should update existing value', () => {
    sut.shortDesc = 'hello';
    sut.shortDesc = 'world';
    expect(sut.shortDesc).toEqual('world');
  });
  test('it should update existing value without creating a 2nd field', () => {
    sut.shortDesc = 'hello';
    sut.shortDesc = 'world';
    expect(sut.fields.length).toBe(1);
  });
});

describe('expiry', () => {
  test('default get value is 3600', () => {
    expect(sut.expiry).toBe(3600);
  });
});

describe('minFinalCltvExpiry', () => {
  test('default get value is 9', () => {
    expect(sut.minFinalCltvExpiry).toBe(9);
  });
  test('set will create field', () => {
    sut.minFinalCltvExpiry = 9;
    expect(sut.fields[0]).toEqual({ type: 24, value: 9 });
  });
});

describe('paymentHash', () => {
  test('when set string converts to a buffer', () => {
    sut.paymentHash = '0001020304050607080900010203040506070809000102030405060708090102';
    expect(sut.paymentHash).toEqual(
      Buffer.from('0001020304050607080900010203040506070809000102030405060708090102', 'hex')
    );
  });
  test('when set buffer keeps as buffer', () => {
    sut.paymentHash = Buffer.from(
      '0001020304050607080900010203040506070809000102030405060708090102',
      'hex'
    );
    expect(sut.paymentHash).toEqual(
      Buffer.from('0001020304050607080900010203040506070809000102030405060708090102', 'hex')
    );
  });
});

describe('hashDesc', () => {
  test('when set string, sha256 hashes value', () => {
    sut.hashDesc = 'hello';
    expect(sut.hashDesc).toEqual(
      Buffer.from('2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824', 'hex')
    );
  });
  test('when set buffer, keeps as buffer', () => {
    sut.hashDesc = Buffer.from(
      '2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824',
      'hex'
    );
    expect(sut.hashDesc).toEqual(
      Buffer.from('2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824', 'hex')
    );
  });
});

describe('payeeNode', () => {
  test('when set string, converts to buffer', () => {
    sut.payeeNode = '000102030405060708090001020304050607080900010203040506070809010200';
    expect(sut.payeeNode).toEqual(
      Buffer.from('000102030405060708090001020304050607080900010203040506070809010200', 'hex')
    );
  });
  test('when set buffer, keeps as buffer', () => {
    sut.payeeNode = Buffer.from(
      '000102030405060708090001020304050607080900010203040506070809010200',
      'hex'
    );
    expect(sut.payeeNode).toEqual(
      Buffer.from('000102030405060708090001020304050607080900010203040506070809010200', 'hex')
    );
  });
});

describe('addFallbackAddress', () => {
  test('Bitcoin Mainnet P2PKH - 1', () => {
    sut.addFallbackAddress('17VZNX1SN5NtKa8UQFxwQbFeFc3iqRYhem');
    expect(sut.fields[0].value.type).toBe(17);
    expect(sut.fields[0].value.address).toEqual(
      Buffer.from('47376c6f537d62177a2c41c4ca9b45829ab99083', 'hex')
    );
  });
  test('Bitcoin Testnet P2PKH - m', () => {
    sut.addFallbackAddress('mipcBbFg9gMiCh81Kj8tqqdgoZub1ZJRfn');
    expect(sut.fields[0].value.type).toBe(17);
    expect(sut.fields[0].value.address).toEqual(
      Buffer.from('243f1394f44554f4ce3fd68649c19adc483ce924', 'hex')
    );
  });
  test('Bitcoin Testnet P2PKH - n', () => {
    sut.addFallbackAddress('n11ByR8jqq6DiPB7ny2Udt9tK7QDVKNXKw');
    expect(sut.fields[0].value.type).toBe(17);
    expect(sut.fields[0].value.address).toEqual(
      Buffer.from('d5c174880d3dcdaf904cd89f06f1f2862c948cb7', 'hex')
    );
  });
  test('Bitcoin Mainnet P2SH - 3', () => {
    sut.addFallbackAddress('3EktnHQD7RiAE6uzMj2ZifT9YgRrkSgzQX');
    expect(sut.fields[0].value.type).toBe(18);
    expect(sut.fields[0].value.address).toEqual(
      Buffer.from('8f55563b9a19f321c211e9b9f38cdf686ea07845', 'hex')
    );
  });
  test('Bitcoin Testnet P2SH - 2', () => {
    sut.addFallbackAddress('2MzQwSSnBHWHqSAqtTVQ6v47XtaisrJa1Vc');
    expect(sut.fields[0].value.type).toBe(18);
    expect(sut.fields[0].value.address).toEqual(
      Buffer.from('4e9f39ca4688ff102128ea4ccda34105324305b0', 'hex')
    );
  });
  test('Bitcoin Mainnet Bech32', () => {
    sut.addFallbackAddress('bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4');
    expect(sut.fields[0].value.type).toBe(0);
    expect(sut.fields[0].value.address).toEqual(
      Buffer.from('751e76e8199196d454941c45d1b3a323f1433bd6', 'hex')
    );
  });
  test('Bitcoin Testnet Bech32', () => {
    sut.addFallbackAddress('tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx');
    expect(sut.fields[0].value.type).toBe(0);
    expect(sut.fields[0].value.address).toEqual(
      Buffer.from('751e76e8199196d454941c45d1b3a323f1433bd6', 'hex')
    );
  });
});
