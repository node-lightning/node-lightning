const PongMessage = require('./pong-message');

test('it should serialize with ignored bytes', () => {
  let sut = new PongMessage();
  sut.ignored = Buffer.alloc(2);
  expect(sut.serialize()).toEqual(Buffer.from([0, 19, 0, 2, 0, 0]));
});

test('it should deserialize type 19', () => {
  let result = PongMessage.deserialize(Buffer.from([0, 19, 0, 2, 0, 0]));
  expect(result.type).toBe(19);
});

test('it should deserialize ignored', () => {
  let result = PongMessage.deserialize(Buffer.from([0, 19, 0, 2, 0, 0]));
  expect(result.ignored).toEqual(Buffer.alloc(2));
});

test('it should create a valid reply for a ping', () => {
  let result = PongMessage.createReply({ type: 18, num_pong_bytes: 4 });
  expect(result.type).toBe(19);
  expect(result.ignored).toEqual(Buffer.alloc(4));
});
