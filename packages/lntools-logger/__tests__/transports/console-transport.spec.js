const { expect } = require('chai');
const sinon = require('sinon');
const { ConsoleTransport } = require('../../lib/transports/console-transport');

describe('ConsoleTransport', () => {
  describe('.write', () => {
    it('should write to the console', () => {
      let stub = {
        log: sinon.stub(),
      };
      let sut = new ConsoleTransport(stub);
      sut.write('hello');
      expect(stub.log.args[0]).to.deep.equal(['hello']);
    });
  });
});
