import { expect } from "chai";
import { ErrorMessage } from "../../lib/messages/ErrorMessage";

describe("ErrorMessage", () => {
    describe(".serialize", () => {
        it("should serialize an error with a channelId", () => {
            const sut = new ErrorMessage();
            sut.channelId = Buffer.alloc(32, 1);
            expect(sut.serialize().toString("hex")).to.equal(
                "0011" +
                "0101010101010101010101010101010101010101010101010101010101010101" +
                "0000"
            ); // prettier-ignore
        });

        it("should serialize with data bytes", () => {
            const sut = new ErrorMessage();
            sut.channelId = Buffer.alloc(32, 1);
            sut.data = Buffer.from([250, 250]);
            expect(sut.serialize().toString("hex")).to.equal(
                "0011" +
                "0101010101010101010101010101010101010101010101010101010101010101" +
                "0002" +
                "fafa"
            ); // prettier-ignore
        });
    });

    describe(".deserialize", () => {
        it("should deserialize type 17", () => {
            const result = ErrorMessage.deserialize(
                Buffer.from(
                    "0017" +
                        "0101010101010101010101010101010101010101010101010101010101010101" +
                        "0002" +
                        "fafa",
                    "hex",
                ),
            );
            expect(result.type).to.equal(17);
        });

        it("should deserialize channelId", () => {
            const result = ErrorMessage.deserialize(
                Buffer.from(
                    "0017" +
                        "0101010101010101010101010101010101010101010101010101010101010101" +
                        "0002" +
                        "fafa",
                    "hex",
                ),
            );
            expect(result.channelId).to.deep.equal(Buffer.alloc(32, 0x01));
        });

        it("should deserialize data", () => {
            const result = ErrorMessage.deserialize(
                Buffer.from(
                    "0017" +
                        "0101010101010101010101010101010101010101010101010101010101010101" +
                        "0002" +
                        "fafa",
                    "hex",
                ),
            );
            expect(result.data).to.deep.equal(Buffer.from([250, 250]));
        });
    });
});
