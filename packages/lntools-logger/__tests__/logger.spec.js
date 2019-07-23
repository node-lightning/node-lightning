const { expect } = require('chai');
const sinon = require('sinon');
const { Logger } = require('../lib/logger');

describe('Logger', () => {
  let writer;
  beforeEach(() => {
    writer = sinon.stub();
  });

  let fixtures = [
    { fn: 'debug', level: 'DBG' },
    { fn: 'info', level: 'INF' },
    { fn: 'warn', level: 'WRN' },
    { fn: 'error', level: 'ERR' },
  ];

  for (let { fn, level } of fixtures) {
    describe('.' + fn, () => {
      let sut;
      beforeEach(() => {
        sut = new Logger('area', 'instance', writer);
      });

      it('should call writer with ' + level, () => {
        sut[fn]('testing');
        expect(writer.args[0][0]).to.equal(level);
      });

      it('should call writer with area', () => {
        sut[fn]('testing');
        expect(writer.args[0][1]).to.equal('area');
      });

      it('should call writer with instance', () => {
        sut[fn]('testing');
        expect(writer.args[0][2]).to.equal('instance');
      });

      it('should call writer with message', () => {
        sut[fn]('testing');
        expect(writer.args[0][3]).to.equal('testing');
      });

      it('should call write with single variable message', () => {
        sut[fn](5);
        expect(writer.args[0][3]).to.equal('5');
      });

      it('should call write with sprintf message', () => {
        sut[fn]('testing %s, %d, %j', 'hello', 5, { foo: 'bar' });
        expect(writer.args[0][3]).to.equal('testing hello, 5, {"foo":"bar"}');
      });

      it('should call write with variadic message', () => {
        sut[fn]('testing', 1, 2, 3, 4, '5');
        expect(writer.args[0][3]).to.equal('testing 1 2 3 4 5');
      });

      it('should work unbounded', () => {
        let debug = sut[fn];
        debug('testing');
        expect(writer.called).to.be.true;
      });
    });
  }
});
