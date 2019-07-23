const { expect } = require('chai');
const sinon = require('sinon');
const { LogManager } = require('../lib/log-manager');

describe('LogManager', () => {
  /** @type {LogManager}  */
  let sut;
  let transport;

  beforeEach(() => {
    transport = { write: sinon.stub() };
    sut = new LogManager();
    sut.transports.push(transport);
  });

  it('should default log level of INF', () => {
    expect(sut.level).to.equal('INF');
  });

  it('should ignore messages below setting', () => {
    let logger = sut.create('area');
    logger.debug('testing');
    expect(transport.write.callCount).to.equal(0);
  });

  describe('create logger with instance', () => {
    it('should create logger with instance', () => {
      let logger = sut.create('area', 'instance');
      expect(logger.name).to.equal('area');
      expect(logger.instance).to.equal('instance');
      expect(logger.writer).to.be.a('function');
    });

    it('should write a message to the transport', () => {
      let logger = sut.create('area', 'instance');
      logger.info('testing');
      expect(transport.write.args[0][0]).to.match(
        /\d\d\d\d-\d\d-\d\dT\d\d:\d\d:\d\d\.\d\d\dZ \[INF\] AREA instance: testing/
      );
    });
  });

  describe('create logger without instance', () => {
    it('should create logger without an instance', () => {
      let logger = sut.create('area');
      expect(logger.name).to.equal('area');
      expect(logger.instance).to.be.undefined;
      expect(logger.writer).to.be.a('function');
    });

    it('should write a message to the transport', () => {
      let logger = sut.create('area');
      logger.info('testing');
      expect(transport.write.args[0][0]).to.match(
        /\d\d\d\d-\d\d-\d\dT\d\d:\d\d:\d\d\.\d\d\dZ \[INF\] AREA: testing/
      );
    });
  });
});
