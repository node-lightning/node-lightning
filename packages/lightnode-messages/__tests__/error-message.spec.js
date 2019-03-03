const { expect } = require('chai');
const ErrorMessage = require('../lib/error-message');

describe('error-message', () => {
  it('it should serialize with num_pong_bytes', () => {
    let sut = new ErrorMessage();
    sut.channel_id = 1;
    expect(sut.serialize()).to.deep.equal(Buffer.from([0, 17, 0, 0, 0, 1, 0, 0]));
  });

  it('it should serialize with data bytes', () => {
    let sut = new ErrorMessage();
    sut.channel_id = 1;
    sut.data = Buffer.from([250, 250]);
    expect(sut.serialize()).to.deep.equal(Buffer.from([0, 17, 0, 0, 0, 1, 0, 2, 250, 250]));
  });

  it('it should deserialize type 17', () => {
    let result = ErrorMessage.deserialize(Buffer.from([0, 17, 0, 0, 0, 1, 0, 2, 250, 250]));
    expect(result.type).to.equal(17);
  });

  it('it should deserialize data', () => {
    let result = ErrorMessage.deserialize(Buffer.from([0, 17, 0, 0, 0, 1, 0, 2, 250, 250]));
    expect(result.data).to.deep.equal(Buffer.from([250, 250]));
  });
});
