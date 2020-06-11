import { expect } from "chai";
import { AddressIPv4 } from "../../lib/domain/AddressIPv4";

describe("AddressIPv4", () => {
    let sut: AddressIPv4;

    before(() => {
        sut = new AddressIPv4("127.0.0.1", 9735);
    });

    it("should have type 1", () => {
        expect(sut.type).to.equal(1);
    });

    describe(".toString", () => {
        it("should return address concatinated with port", () => {
            const actual = sut.toString();
            const expected = "127.0.0.1:9735";
            expect(actual).to.equal(expected);
        });
    });

    describe(".toJSON", () => {
        it("should return object", () => {
            const actual = sut.toJSON();
            expect(actual).to.deep.equal({
                network: "tcp",
                address: "127.0.0.1:9735",
            });
        });
    });
});
