const { expect } = require('chai');
const PingMessage = require('../lib/ping-message');

describe('ping-message', () => {
  it('it should serialize with num_pong_bytes', () => {
    let sut = new PingMessage();
    sut.num_pong_bytes = 12;
    expect(sut.serialize()).to.deep.equal(Buffer.from([0, 18, 0, 12, 0, 0]));
  });

  it('it should serialize with ignored bytes', () => {
    let sut = new PingMessage();
    sut.num_pong_bytes = 1;
    sut.ignored = Buffer.alloc(2);
    expect(sut.serialize()).to.deep.equal(Buffer.from([0, 18, 0, 1, 0, 2, 0, 0]));
  });

  it('it should deserialize type 18', () => {
    let result = PingMessage.deserialize(Buffer.from([0, 18, 0, 12, 0, 0]));
    expect(result.type).to.equal(18);
  });

  it('it should deserialize num_pong_bytes', () => {
    let result = PingMessage.deserialize(Buffer.from([0, 18, 0, 12, 0, 0]));
    expect(result.num_pong_bytes).to.equal(12);
  });

  it('it should deserialize ignored', () => {
    let result = PingMessage.deserialize(Buffer.from([0, 18, 0, 1, 0, 2, 0, 0]));
    expect(result.ignored).to.deep.equal(Buffer.alloc(2));
  });
});
