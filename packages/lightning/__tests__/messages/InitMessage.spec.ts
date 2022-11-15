// tslint:disable: no-unused-expression
import { expect } from "chai";
import { InitMessage } from "../../lib/messages/InitMessage";

describe("InitMessage", () => {
    it("should have correct default values", () => {
        const obj = new InitMessage();
        expect(obj.type).to.equal(16);
        expect(obj.features.toNumber()).to.equal(0);
    });

    describe(".serialize", () => {
        it("should serialize type", () => {
            const obj = new InitMessage();
            const result = obj.serialize();
            expect(result.toString("hex")).to.equal("001000000000");
        });

        it("should serialize features", () => {
            const obj = new InitMessage();
            obj.features.set(3);
            const result = obj.serialize();
            expect(result.toString("hex")).to.equal("00100000000108");
        });

        it("should serialize network tlv", () => {
            const obj = new InitMessage();
            obj.chainHashes.push(Buffer.alloc(32, 255));
            const result = obj.serialize();
            expect(result.toString("hex")).to.equal(
                "0010000000000120ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff",
            );
        });

        it("should serialize network tlv", () => {
            const obj = new InitMessage();
            obj.chainHashes.push(Buffer.alloc(32, 0xff));
            obj.chainHashes.push(Buffer.alloc(32, 0xee));
            const result = obj.serialize();
            expect(result.toString("hex")).to.equal(
                "0010000000000140ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
            );
        });
    });

    describe(".deserialize", () => {
        const remote = "0010000102000180";

        it("should deserialize type", () => {
            const result = InitMessage.deserialize(Buffer.from(remote, "hex"));
            expect(result.type).to.equal(16);
        });

        it("should deserialize globalFeatures", () => {
            const result = InitMessage.deserialize(Buffer.from(remote, "hex"));
            expect(result.features.toNumber()).to.equal(0x82);
        });

        it("should deserialize localFeatures", () => {
            const result = InitMessage.deserialize(Buffer.from(remote, "hex"));
            expect(result.features.toNumber()).to.equal(0x82);
        });

        it("should deserialize network tlv", () => {
            const result = InitMessage.deserialize(
                Buffer.from(
                    "0010000000000140ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
                    "hex",
                ),
            );
            expect(result.chainHashes.length).to.equal(2);
            expect(result.chainHashes[0].toString("hex")).to.equal("ff".repeat(32));
            expect(result.chainHashes[1].toString("hex")).to.equal("ee".repeat(32));
        });
    });
});
