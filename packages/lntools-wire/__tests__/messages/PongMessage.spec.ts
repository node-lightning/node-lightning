import { expect } from "chai";
import { PongMessage } from "../../lib/messages/PongMessage";

describe("PongMessage", () => {
    describe(".serialize", () => {
        it("should serialize with ignored bytes", () => {
            const sut = new PongMessage(2);
            expect(sut.serialize()).to.deep.equal(Buffer.from([0, 19, 0, 2, 0, 0]));
        });
    });

    describe(".deserialize", () => {
        it("should deserialize type 19", () => {
            const result = PongMessage.deserialize(Buffer.from([0, 19, 0, 2, 0, 0]));
            expect(result.type).to.equal(19);
        });

        it("should deserialize ignored", () => {
            const result = PongMessage.deserialize(Buffer.from([0, 19, 0, 2, 0, 0]));
            expect(result.ignored).to.deep.equal(Buffer.alloc(2));
        });
    });
});
