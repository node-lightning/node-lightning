import { expect } from "chai";
import { AddressTor3 } from "../../lib/domain/AddressTor3";

describe("AddressTor3", () => {
    let sut: AddressTor3;

    before(() => {
        sut = new AddressTor3("abcdefghijabcdefghijabcdefghij23456.onion", 9735);
    });

    it("should have type 4", () => {
        expect(sut.type).to.equal(4);
    });

    describe(".toString", () => {
        it("should return address concatinated with port", () => {
            const actual = sut.toString();
            const expected = "abcdefghijabcdefghijabcdefghij23456.onion:9735";
            expect(actual).to.equal(expected);
        });
    });

    describe(".toJSON", () => {
        it("should return object", () => {
            const actual = sut.toJSON();
            expect(actual).to.deep.equal({
                network: "tcp",
                address: "abcdefghijabcdefghijabcdefghij23456.onion:9735",
            });
        });
    });
});
