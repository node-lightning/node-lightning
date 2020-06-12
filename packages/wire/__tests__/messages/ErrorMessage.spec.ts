import { expect } from "chai";
import { ErrorMessage } from "../../lib/messages/ErrorMessage";

describe("ErrorMessage", () => {
    describe(".serialize", () => {
        it("should serialize an error with a channelId", () => {
            const sut = new ErrorMessage();
            sut.channelId = 1;
            expect(sut.serialize()).to.deep.equal(Buffer.from([0, 17, 0, 0, 0, 1, 0, 0]));
        });

        it("should serialize with data bytes", () => {
            const sut = new ErrorMessage();
            sut.channelId = 1;
            sut.data = Buffer.from([250, 250]);
            expect(sut.serialize()).to.deep.equal(Buffer.from([0, 17, 0, 0, 0, 1, 0, 2, 250, 250]));
        });
    });

    describe(".deserialize", () => {
        it("should deserialize type 17", () => {
            const result = ErrorMessage.deserialize(
                Buffer.from([0, 17, 0, 0, 0, 1, 0, 2, 250, 250]),
            );
            expect(result.type).to.equal(17);
        });

        it("should deserialize channelId", () => {
            const result = ErrorMessage.deserialize(
                Buffer.from([0, 17, 0, 0, 0, 1, 0, 2, 250, 250]),
            );
            expect(result.channelId).to.equal(1);
        });

        it("should deserialize data", () => {
            const result = ErrorMessage.deserialize(
                Buffer.from([0, 17, 0, 0, 0, 1, 0, 2, 250, 250]),
            );
            expect(result.data).to.deep.equal(Buffer.from([250, 250]));
        });
    });
});
