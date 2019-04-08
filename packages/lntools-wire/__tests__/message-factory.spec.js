const { expect } = require('chai');
const sut = require('../lib/message-factory');

describe('MessageFactory', () => {
  describe('.deserialize()', () => {
    it('should return constructed type', () => {
      let input = Buffer.from('001000000000', 'hex');
      let result = sut.deserialize(input);
      expect(result).to.not.be.undefined;
    });

    it('should not return for unkonwn types', () => {
      let input = Buffer.from('111100000000', 'hex');
      let result = sut.deserialize(input);
      expect(result).to.be.undefined;
    });
  });

  describe('.construct()', () => {
    it('should make a message', () => {
      let result = sut.construct(258);
      expect(result).to.not.be.undefined;
    });
  });
});
