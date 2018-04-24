let InitMessage = require('./init-message');
let remote =
  '00360a800c27f83bebc66efa1f580554c65bed3da1b6352d2f5dbb702e90ac20bb1d34dc0bdd444163ca18468d568dbeeda2c865909bf129498680f792c197e923fd';

test('deserialize', () => {
  let result = InitMessage.deserialize(Buffer.from(remote, 'hex'));
  expect(result).toEqual({ type: 16, globalFeatures: 54, localFeatures: 2688 });
});

test('default values', () => {
  let obj = new InitMessage();
  expect(obj.type).toBe(16);
  expect(obj.globalFeatures).toBe(0);
  expect(obj.localFeatures).toBe(0);
});

test('serialize', () => {
  let obj = new InitMessage();
  obj.globalFeatures = 2;
  obj.localFeatures = 4;
  let result = obj.serialize();
  expect(result.toString('hex')).toBe('001000020004');
});
