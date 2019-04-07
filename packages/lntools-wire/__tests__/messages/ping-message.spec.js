const { expect } = require('chai');
const PingMessage = require('../../lib/messages/ping-message');

describe('PingMessage', () => {
  describe('get .triggersReply', () => {
    it('should be true when less than 65532', () => {
      let sut = new PingMessage();
      sut.numPongBytes = 1;
      expect(sut.triggersReply).to.be.true;
    });

    it('should be false when greater than 65531', () => {
      let sut = new PingMessage();
      sut.numPongBytes = 65532;
      expect(sut.triggersReply).to.be.false;
    });
  });

  describe('.serialize', () => {
    it('should serialize with num_pong_bytes', () => {
      let sut = new PingMessage();
      sut.numPongBytes = 12;
      expect(sut.serialize()).to.deep.equal(Buffer.from([0, 18, 0, 12, 0, 0]));
    });

    it('should serialize with ignored bytes', () => {
      let sut = new PingMessage();
      sut.numPongBytes = 1;
      sut.ignored = Buffer.alloc(2);
      expect(sut.serialize()).to.deep.equal(Buffer.from([0, 18, 0, 1, 0, 2, 0, 0]));
    });
  });

  describe('.deserialize', () => {
    it('should deserialize type 18', () => {
      let result = PingMessage.deserialize(Buffer.from([0, 18, 0, 12, 0, 0]));
      expect(result.type).to.equal(18);
    });

    it('should deserialize num_pong_bytes', () => {
      let result = PingMessage.deserialize(Buffer.from([0, 18, 0, 12, 0, 0]));
      expect(result.numPongBytes).to.equal(12);
    });

    it('should deserialize ignored', () => {
      let result = PingMessage.deserialize(Buffer.from([0, 18, 0, 1, 0, 2, 0, 0]));
      expect(result.ignored).to.deep.equal(Buffer.alloc(2));
    });
  });
});
