const ErrorMessage = require('./error-message');

test('it should serialize with num_pong_bytes', () => {
  let sut = new ErrorMessage();
  sut.channel_id = 1;
  expect(sut.serialize()).toEqual(Buffer.from([0, 17, 0, 0, 0, 1, 0, 0]));
});

test('it should serialize with data bytes', () => {
  let sut = new ErrorMessage();
  sut.channel_id = 1;
  sut.data = Buffer.from([250, 250]);
  expect(sut.serialize()).toEqual(Buffer.from([0, 17, 0, 0, 0, 1, 0, 2, 250, 250]));
});

test('it should deserialize type 17', () => {
  let result = ErrorMessage.deserialize(Buffer.from([0, 17, 0, 0, 0, 1, 0, 2, 250, 250]));
  expect(result.type).toBe(17);
});

test('it should deserialize data', () => {
  let result = ErrorMessage.deserialize(Buffer.from([0, 17, 0, 0, 0, 1, 0, 2, 250, 250]));
  expect(result.data).toEqual(Buffer.from([250, 250]));
});
