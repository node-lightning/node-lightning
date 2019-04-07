const { expect } = require('chai');
const ErrorMessage = require('../../lib/messages/error-message');

describe('ErrorMessage', () => {
  describe('.serialize', () => {
    it('should serialize an error with a channelId', () => {
      let sut = new ErrorMessage();
      sut.channelId = 1;
      expect(sut.serialize()).to.deep.equal(Buffer.from([0, 17, 0, 0, 0, 1, 0, 0]));
    });

    it('should serialize with data bytes', () => {
      let sut = new ErrorMessage();
      sut.channelId = 1;
      sut.data = Buffer.from([250, 250]);
      expect(sut.serialize()).to.deep.equal(Buffer.from([0, 17, 0, 0, 0, 1, 0, 2, 250, 250]));
    });
  });

  describe('.deserialize', () => {
    it('should deserialize type 17', () => {
      let result = ErrorMessage.deserialize(Buffer.from([0, 17, 0, 0, 0, 1, 0, 2, 250, 250]));
      expect(result.type).to.equal(17);
    });

    it('should deserialize channelId', () => {
      let result = ErrorMessage.deserialize(Buffer.from([0, 17, 0, 0, 0, 1, 0, 2, 250, 250]));
      expect(result.channelId).to.equal(1);
    });

    it('should deserialize data', () => {
      let result = ErrorMessage.deserialize(Buffer.from([0, 17, 0, 0, 0, 1, 0, 2, 250, 250]));
      expect(result.data).to.deep.equal(Buffer.from([250, 250]));
    });
  });
});
