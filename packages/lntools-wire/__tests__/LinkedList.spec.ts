// tslint:disable: no-unused-expression
import { expect } from "chai";
import { LinkedList } from "../lib/LinkedList";

describe("LinkedList", () => {
    let sut: LinkedList<number>;

    beforeEach(() => {
        sut = new LinkedList<number>();
    });

    it("should initialize with length 0", () => {
        expect(sut.length).to.equal(0);
    });

    it("should initialize with null head", () => {
        expect(sut.head).to.be.null;
    });

    it("should initialize with a null tail", () => {
        expect(sut.tail).to.be.null;
    });

    describe(".add", () => {
        describe("on first insert", () => {
            it("should increase length when item is added", () => {
                sut.add(1);
                expect(sut.length).to.equal(1);
            });

            it("should set head to first node", () => {
                sut.add(1);
                expect(sut.head.value).to.equal(1);
            });

            it("should set tail to first node", () => {
                sut.add(1);
                expect(sut.tail.value).to.equal(1);
            });

            it("should not have prev value", () => {
                sut.add(1);
                expect(sut.head.prev).to.be.null;
            });

            it("should not have next value", () => {
                sut.add(1);
                expect(sut.head.next).to.be.null;
            });
        });

        describe("subsequent adds", () => {
            it("should increase length on second add", () => {
                sut.add(1);
                sut.add(2);
                expect(sut.length).to.equal(2);
            });

            it("shoudl not adjust head value", () => {
                sut.add(1);
                sut.add(2);
                expect(sut.head.value).to.equal(1);
            });

            it("should adjust tail value", () => {
                sut.add(1);
                sut.add(2);
                expect(sut.tail.value).to.equal(2);
            });

            it("should attach next value to head", () => {
                sut.add(1);
                sut.add(2);
                expect(sut.head.next.value).to.equal(2);
            });

            it("should not adjust prev value of head", () => {
                sut.add(1);
                sut.add(2);
                expect(sut.head.prev).to.be.null;
            });

            it("should attach prev value to tail ", () => {
                sut.add(1);
                sut.add(2);
                expect(sut.tail.prev.value).to.equal(1);
            });

            it("should not have next value for tail", () => {
                sut.add(1);
                sut.add(2);
                expect(sut.tail.next).to.be.null;
            });
        });
    });

    describe(".valueAt", () => {
        it("should throw when negative position", () => {
            expect(() => sut.valueAt(-1)).to.throw();
        });

        it("should throw when index exceeds length", () => {
            expect(() => sut.valueAt(2)).to.throw();
        });

        it("should return value at first position", () => {
            sut.add(1);
            sut.add(2);
            sut.add(3);
            expect(sut.valueAt(0)).to.equal(1);
        });

        it("should return value in middle position", () => {
            sut.add(1);
            sut.add(2);
            sut.add(3);
            expect(sut.valueAt(1)).to.equal(2);
        });

        it("should return value at end position", () => {
            sut.add(1);
            sut.add(2);
            sut.add(3);
            expect(sut.valueAt(2)).to.equal(3);
        });
    });

    describe(".remove", () => {
        beforeEach(() => {
            sut.add(0);
            sut.add(1);
            sut.add(2);
        });

        it("should throw on negative index argument", () => {
            expect(() => sut.remove(-1)).to.throw();
        });

        it("should throw on out of range index", () => {
            expect(() => sut.remove(4)).to.throw();
        });

        describe("first position", () => {
            it("head should be second node", () => {
                sut.remove(0);
                expect(sut.head.value).to.equal(1);
            });

            it("should set heads prev to null", () => {
                sut.remove(0);

                expect(sut.head.prev).to.be.null;
            });

            it("should have reduced length by 1", () => {
                sut.remove(0);
                expect(sut.length).to.equal(2);
            });
        });

        describe("middle position", () => {
            it("should link over to next position", () => {
                sut.remove(1);
                expect(sut.head.value).to.equal(0);
                expect(sut.head.next.value).to.equal(2);
            });

            it("should link back to prev position", () => {
                sut.remove(1);
                expect(sut.head.next.prev.value).to.equal(0);
            });

            it("should have reduced length by 1", () => {
                sut.remove(1);
                expect(sut.length).to.equal(2);
            });
        });

        describe("end position", () => {
            it("should adjust tail", () => {
                sut.remove(2);
                expect(sut.tail.value).to.equal(1);
            });

            it("should have tail's next set to null", () => {
                sut.remove(2);

                expect(sut.tail.next).to.be.null;
            });

            it("should have tail's prev link to previous", () => {
                sut.remove(2);
                expect(sut.tail.prev.value).to.equal(0);
            });

            it("should have tail's previous's next link to tail", () => {
                sut.remove(2);
                expect(sut.tail.prev.next.value).to.equal(1);
            });

            it("should have reduced length by 1", () => {
                sut.remove(2);
                expect(sut.length).to.equal(2);
            });
        });

        describe("all from head", () => {
            beforeEach(() => {
                sut.remove(0);
                sut.remove(0);
                sut.remove(0);
            });

            it("should have null head", () => {
                expect(sut.head).to.be.null;
            });

            it("should have null tail", () => {
                expect(sut.tail).to.be.null;
            });

            it("should have length of 0", () => {
                expect(sut.length).to.equal(0);
            });
        });

        describe("all from tail", () => {
            beforeEach(() => {
                sut.remove(2);
                sut.remove(1);
                sut.remove(0);
            });

            it("should have null head", () => {
                expect(sut.head).to.be.null;
            });

            it("should have null tail", () => {
                expect(sut.tail).to.be.null;
            });

            it("should have length of 0", () => {
                expect(sut.length).to.equal(0);
            });
        });
    });
});
