const { expect } = require('chai');
const { Queue } = require('../lib/queue');

describe('Queue', () => {
  /** @type {Queue} */
  let sut;

  beforeEach(() => {
    sut = new Queue();
  });

  describe('enqueue', () => {
    it('should add an item to the queue', () => {
      sut.enqueue(1);
      expect(sut.peak()).to.equal(1);
    });

    it('should increase length of queue', () => {
      sut.enqueue(1);
      expect(sut.length).to.equal(1);
    });

    it('should add a second item to the queue', () => {
      sut.enqueue(1);
      sut.enqueue(2);
      expect(sut.length).to.equal(2);
    });
  });

  describe('dequeue', () => {
    it('should throw when nothing to dequeue', () => {
      expect(() => sut.dequeue()).to.throw();
    });

    it('should return item', () => {
      sut.enqueue(1);
      sut.enqueue(2);
      let result = sut.dequeue();
      expect(result).to.equal(1);
    });

    it('should decrease length', () => {
      sut.enqueue(1);
      sut.enqueue(2);
      sut.dequeue();
      expect(sut.length).to.equal(1);
    });
  });
});
