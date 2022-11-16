// tslint:disable: no-unused-expression
import { expect } from "chai";
import * as sut from "../lib/MessageFactory";

describe("MessageFactory", () => {
    describe(".deserialize()", () => {
        it("should return constructed type", () => {
            const input = Buffer.from("001000000000", "hex");
            const result = sut.deserialize(input);
            expect(result).to.not.be.undefined;
        });

        it("should not return for unkonwn types", () => {
            const input = Buffer.from("111100000000", "hex");
            const result = sut.deserialize(input);
            expect(result).to.be.undefined;
        });
    });
});
