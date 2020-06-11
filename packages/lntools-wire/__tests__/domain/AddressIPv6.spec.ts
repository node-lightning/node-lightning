import { expect } from "chai";
import { AddressIPv6 } from "../../lib/domain/AddressIPv6";

describe("AddressIPv6", () => {
    let sut: AddressIPv6;

    before(() => {
        sut = new AddressIPv6("::1", 9735);
    });

    it("should have type 2", () => {
        expect(sut.type).to.equal(2);
    });

    describe(".toString", () => {
        it("should return address concatinated with port", () => {
            const actual = sut.toString();
            const expected = "[::1]:9735";
            expect(actual).to.equal(expected);
        });
    });

    describe(".toJSON", () => {
        it("should return object", () => {
            const actual = sut.toJSON();
            expect(actual).to.deep.equal({
                network: "tcp",
                address: "[::1]:9735",
            });
        });
    });
});
