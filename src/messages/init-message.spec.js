let InitMessage = require('./init-message');
let remote =
  '00F000360a800c27f83bebc66efa1f580554c65bed3da1b6352d2f5dbb702e90ac20bb1d34dc0bdd444163ca18468d568dbeeda2c865909bf129498680f792c197e923fd';

test('it should have correct default values', () => {
  let obj = new InitMessage();
  expect(obj.type).toBe(16);
  expect(obj.globalFeatures).toBe(0);
  expect(obj.localFeatures).toBe(0);
});

test('it should deserialize type', () => {
  let result = InitMessage.deserialize(Buffer.from(remote, 'hex'));
  expect(result.type).toBe(16);
});

test('it should deserialize globalFeatures', () => {
  let result = InitMessage.deserialize(Buffer.from(remote, 'hex'));
  expect(result.globalFeatures).toBe(54);
});

test('it should deserialize localFeatures', () => {
  let result = InitMessage.deserialize(Buffer.from(remote, 'hex'));
  expect(result.localFeatures).toBe(2688);
});

test('it should serialize type', () => {
  let obj = new InitMessage();
  let result = obj.serialize();
  expect(result.toString('hex')).toBe('001000000000');
});

test('it should serialize globalFeatures', () => {
  let obj = new InitMessage();
  obj.globalFeatures = 2;
  let result = obj.serialize();
  expect(result.toString('hex')).toBe('001000020000');
});

test('it should serialize localFeatures', () => {
  let obj = new InitMessage();
  obj.localFeatures = 4;
  let result = obj.serialize();
  expect(result.toString('hex')).toBe('001000000004');
});
