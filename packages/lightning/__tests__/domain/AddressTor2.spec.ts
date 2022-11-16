import { expect } from "chai";
import { AddressTor2 } from "../../lib/domain/AddressTor2";

describe("AddressTor2", () => {
    let sut: AddressTor2;

    before(() => {
        sut = new AddressTor2("abcdefghij.onion", 9735);
    });

    it("should have type 3", () => {
        expect(sut.type).to.equal(3);
    });

    describe(".toString", () => {
        it("should return address concatinated with port", () => {
            const actual = sut.toString();
            const expected = "abcdefghij.onion:9735";
            expect(actual).to.equal(expected);
        });
    });

    describe(".toJSON", () => {
        it("should return object", () => {
            const actual = sut.toJSON();
            expect(actual).to.deep.equal({
                network: "tcp",
                address: "abcdefghij.onion:9735",
            });
        });
    });
});
