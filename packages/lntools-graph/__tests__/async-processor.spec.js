const { expect } = require('chai');
const { AsyncProcessor } = require('../lib/async-processor');

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

describe('AsyncProcessor', () => {
  describe('.enqueue', () => {
    it('should call fn with enqueued value', done => {
      let sut = new AsyncProcessor(async val => {
        try {
          expect(val).to.equal(1);
          done();
        } catch (ex) {
          done(ex);
        }
      });
      sut.enqueue(1);
    });

    it('should enqueue value while flushing', done => {
      let called = 0;
      let sut = new AsyncProcessor(async () => {
        await wait(20);
        if (++called === 2) done();
      });
      sut.enqueue(1);
      setTimeout(() => sut.enqueue(2), 10);
    });

    it('should return size while flushing', done => {
      let sut = new AsyncProcessor(async () => {
        await wait(20);
        done();
      });
      sut.enqueue(1);
      expect(sut.size).to.equal(1);
    });

    it('should emit error if processing error', done => {
      let sut = new AsyncProcessor(async () => {
        throw new Error('boom');
      });
      sut.on('error', () => done());
      sut.enqueue(1);
    });

    it('should emit flushing event when starting to flush', done => {
      let sut = new AsyncProcessor(async () => {});
      sut.on('flushing', () => {
        try {
          expect(sut.size).to.equal(1);
          done();
        } catch (ex) {
          done(ex);
        }
      });
      sut.enqueue(1);
    });

    it('should emit flushed event when flush complete', done => {
      let sut = new AsyncProcessor(async () => {});
      sut.on('flushed', () => {
        try {
          expect(sut.size).to.equal(0);
          done();
        } catch (ex) {
          done(ex);
        }
      });
      sut.enqueue(1);
    });
  });
});
