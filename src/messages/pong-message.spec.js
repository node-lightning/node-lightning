const { expect } = require('chai');
const PongMessage = require('./pong-message');

describe('pong-message', () => {
  it('it should serialize with ignored bytes', () => {
    let sut = new PongMessage();
    sut.ignored = Buffer.alloc(2);
    expect(sut.serialize()).to.deep.equal(Buffer.from([0, 19, 0, 2, 0, 0]));
  });

  it('it should deserialize type 19', () => {
    let result = PongMessage.deserialize(Buffer.from([0, 19, 0, 2, 0, 0]));
    expect(result.type).to.equal(19);
  });

  it('it should deserialize ignored', () => {
    let result = PongMessage.deserialize(Buffer.from([0, 19, 0, 2, 0, 0]));
    expect(result.ignored).to.deep.equal(Buffer.alloc(2));
  });

  it('it should create a valid reply for a ping', () => {
    let result = PongMessage.createReply({ type: 18, num_pong_bytes: 4 });
    expect(result.type).to.equal(19);
    expect(result.ignored).to.deep.equal(Buffer.alloc(4));
  });
});
