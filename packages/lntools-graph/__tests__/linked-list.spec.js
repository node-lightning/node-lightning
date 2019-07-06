const { expect } = require('chai');
const { LinkedList } = require('../lib/linked-list');

describe('LinkedList', () => {
  /** @type {LinkedList} */
  let sut;

  beforeEach(() => {
    sut = new LinkedList();
  });

  it('should initialize with length 0', () => {
    expect(sut.length).to.equal(0);
  });

  it('should initialize with null head', () => {
    expect(sut.head).to.be.null;
  });

  it('should initialize with a null tail', () => {
    expect(sut.tail).to.be.null;
  });

  describe('.add', () => {
    describe('on first insert', () => {
      it('should increase length when item is added', () => {
        sut.add(1);
        expect(sut.length).to.equal(1);
      });

      it('should set head to first node', () => {
        sut.add(1);
        expect(sut.head.value).to.equal(1);
      });

      it('should set tail to first node', () => {
        sut.add(1);
        expect(sut.tail.value).to.equal(1);
      });
    });

    describe('subsequent adds', () => {
      it('should increase length on second add', () => {
        sut.add(1);
        sut.add(2);
        expect(sut.length).to.equal(2);
      });

      it('should attach next value', () => {
        sut.add(1);
        sut.add(2);
        expect(sut.head.value).to.equal(1);
        expect(sut.head.next.value).to.equal(2);
      });

      it('should adjust tail value', () => {
        sut.add(1);
        sut.add(2);
        expect(sut.tail.value).to.equal(2);
      });
    });
  });

  describe('.valueAt', () => {
    it('should throw when negative position', () => {
      expect(() => sut.valueAt(-1)).to.throw();
    });

    it('should throw when index exceeds length', () => {
      expect(() => sut.valueAt(2)).to.throw();
    });

    it('should return value at first position', () => {
      sut.add(1);
      sut.add(2);
      sut.add(3);
      expect(sut.valueAt(0)).to.equal(1);
    });

    it('should return value in middle position', () => {
      sut.add(1);
      sut.add(2);
      sut.add(3);
      expect(sut.valueAt(1)).to.equal(2);
    });

    it('should return value at end position', () => {
      sut.add(1);
      sut.add(2);
      sut.add(3);
      expect(sut.valueAt(2)).to.equal(3);
    });
  });

  describe('.remove', () => {
    beforeEach(() => {
      sut.add(1);
      sut.add(2);
      sut.add(3);
    });

    it('should throw on negative index argument', () => {
      expect(() => sut.remove(-1)).to.throw();
    });

    it('should throw on out of range index', () => {
      expect(() => sut.remove(4)).to.throw();
    });

    describe('first position', () => {
      it('head should be second node', () => {
        sut.remove(0);
        expect(sut.head.value).to.equal(2);
      });

      it('should have reduced length by 1', () => {
        sut.remove(0);
        expect(sut.length).to.equal(2);
      });
    });

    describe('middle position', () => {
      it('should link over to next position', () => {
        sut.remove(1);
        expect(sut.head.value).to.equal(1);
        expect(sut.head.next.value).to.equal(3);
      });

      it('should have reduced length by 1', () => {
        sut.remove(1);
        expect(sut.length).to.equal(2);
      });
    });

    describe('end position', () => {
      it('prior node should have null next', () => {
        sut.remove(2);
        expect(sut.head.value).to.equal(1);
        expect(sut.head.next.value).to.equal(2);
        expect(sut.head.next.next).to.be.null;
      });

      it('should adjust tail', () => {
        sut.remove(2);
        expect(sut.tail.value).to.equal(2);
      });

      it('should have reduced length by 1', () => {
        sut.remove(2);
        expect(sut.length).to.equal(2);
      });
    });
  });
});
