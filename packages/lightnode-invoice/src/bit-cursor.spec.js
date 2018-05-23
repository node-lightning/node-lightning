const BitCursor = require('./bit-cursor');

test('_readLeftBits', () => {
  let input = Buffer.from([213]);
  let sut = new BitCursor(input);
  expect(sut._readLeftBits(input[0], 4)).toBe(13);
});

test('_readRightBits', () => {
  let input = Buffer.from('d5', 'hex');
  let sut = new BitCursor(input);
  expect(sut._readRightBits(input[0], 4)).toBe(5);
});

test('readUIntBE for single byte', () => {
  let input = Buffer.from('01', 'hex');
  let sut = new BitCursor(input);
  expect(sut.readUIntBE(8)).toBe(1);
});

test('readUIntBE with read at start', () => {
  let input = Buffer.from([208]);
  let sut = BitCursor.from(input);
  expect(sut.readUIntBE(4)).toBe(13);
});

test('readUIntBE with middle read', () => {
  let input = Buffer.from([36]);
  let sut = BitCursor.from(input);
  expect(sut.readUIntBE(1)).toBe(0);
  expect(sut.readUIntBE(5)).toBe(9);
});

test('readUIntBE with read at end', () => {
  let input = Buffer.from([246]);
  let sut = BitCursor.from(input);
  expect(sut.readUIntBE(4)).toBe(15);
  expect(sut.readUIntBE(4)).toBe(6);
});

test('readUIntBE across multiple bytes', () => {
  let input = Buffer.from('0c12', 'hex');
  let sut = new BitCursor(input);
  expect(sut.readUIntBE(14)).toBe(772);
});

test('readUIntBE multiple partial bytes', () => {
  let input = Buffer.from('0c12', 'hex');
  let sut = new BitCursor(input);
  expect(sut.readUIntBE(5)).toBe(1);
  expect(sut.readUIntBE(5)).toBe(16);
  expect(sut.readUIntBE(5)).toBe(9);
});

test('readBits with partial bytes', () => {
  let input = Buffer.from('0b', 'hex');
  let sut = new BitCursor(input);
  expect(sut.readBits(4)).toEqual(Buffer.alloc(1));
  expect(sut.readBits(4)).toEqual(Buffer.from('b0', 'hex'));
});

test('readBits with cross byte', () => {
  let input = Buffer.from('ffb3', 'hex');
  let sut = new BitCursor(input);
  expect(sut.readBits(12)).toEqual(Buffer.from('ffb0', 'hex'));
});

test('readBits with partial and cross bytes', () => {
  let input = Buffer.from('ffb3', 'hex');
  let sut = new BitCursor(input);
  expect(sut.readUIntBE(4)).toEqual(15);
  expect(sut.readBits(8)).toEqual(Buffer.from('fb', 'hex'));
});

test('readBytes with full byte', () => {
  let input = Buffer.from('CA0980', 'hex');
  let sut = new BitCursor(input);
  expect(sut.readBytes(16)).toEqual(Buffer.from([202, 9], 'hex'));
});

test('readBytes with partial byte', () => {
  let input = Buffer.from('CA0980', 'hex');
  let sut = new BitCursor(input);
  expect(sut.readBytes(19)).toEqual(Buffer.from([202, 9], 'hex'));
});

test('readBytes with partial and cross bytes with truncate', () => {
  let input = Buffer.from('CA0980', 'hex');
  let sut = new BitCursor(input);
  expect(sut.readBits(5)).toEqual(Buffer.from([200]));
  expect(sut.readBytes(19)).toEqual(Buffer.from([65, 48], 'hex'));
});

test('bitsRemaining at start should have all bits', () => {
  let input = Buffer.from('FFFF', 'hex');
  let sut = new BitCursor(input);
  expect(sut.bitsRemaining).toBe(16);
});

test('bitsRemaining after read should have remaining bits', () => {
  let input = Buffer.from('FFFF', 'hex');
  let sut = BitCursor.from(input);
  sut.readBits(3);
  expect(sut.bitsRemaining).toBe(13);
});

test('bitsRemaining after reading to last byte should have reamining bits', () => {
  let input = Buffer.from('FFFF', 'hex');
  let sut = BitCursor.from(input);
  sut.readBits(3);
  sut.readBits(7);
  expect(sut.bitsRemaining).toBe(6);
});

test('bitsRemaining after reading all bits should be 0', () => {
  let input = Buffer.from('FFFF', 'hex');
  let sut = BitCursor.from(input);
  sut.readBits(3);
  sut.readBits(7);
  sut.readBits(6);
  expect(sut.bitsRemaining).toBe(0);
});

test('print full byte', () => {
  let input = Buffer.from('96', 'hex');
  let sut = BitCursor.from(input);
  expect(sut.currentByteToString()).toBe('10010110');
});

test('print partial vbyte', () => {
  let input = Buffer.from('96', 'hex');
  let sut = BitCursor.from(input);
  sut.readBits(2);
  expect(sut.currentByteToString()).toBe('010110');
});

test('print partial vbyte', () => {
  let input = Buffer.from('9669', 'hex');
  let sut = BitCursor.from(input);
  sut.readBits(2);
  sut.readBits(10);
  expect(sut.currentByteToString()).toBe('1001');
});
