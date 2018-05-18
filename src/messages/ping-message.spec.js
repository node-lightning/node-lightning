const PingMessage = require('./ping-message');

test('it should serialize with num_pong_bytes', () => {
  let sut = new PingMessage();
  sut.num_pong_bytes = 12;
  expect(sut.serialize()).toEqual(Buffer.from([0, 18, 0, 12, 0, 0]));
});

test('it should serialize with ignored bytes', () => {
  let sut = new PingMessage();
  sut.num_pong_bytes = 1;
  sut.ignored = Buffer.alloc(2);
  expect(sut.serialize()).toEqual(Buffer.from([0, 18, 0, 1, 0, 2, 0, 0]));
});

test('it should deserialize type 18', () => {
  let result = PingMessage.deserialize(Buffer.from([0, 18, 0, 12, 0, 0]));
  expect(result.type).toBe(18);
});

test('it should deserialize num_pong_bytes', () => {
  let result = PingMessage.deserialize(Buffer.from([0, 18, 0, 12, 0, 0]));
  expect(result.num_pong_bytes).toBe(12);
});

test('it should deserialize ignored', () => {
  let result = PingMessage.deserialize(Buffer.from([0, 18, 0, 1, 0, 2, 0, 0]));
  expect(result.ignored).toEqual(Buffer.alloc(2));
});
