// tslint:disable: no-unused-expression
import { expect } from "chai";
import { FundingCreatedMessage } from "../../lib/messages/FundingCreatedMessage";

describe("FundingCreatedMessage", () => {
    describe(".deserialize", () => {
        it("should deserialize without error", () => {
            const input = Buffer.from("002200000000000000000000000000000000000000000000000000000000000000001111111111111111111111111111111111111111111111111111111111111111ffff22222222222222222222222222222222222222222222222222222222222222223333333333333333333333333333333333333333333333333333333333333333", "hex"); // prettier-ignore
            const result = FundingCreatedMessage.deserialize(input);
            expect(result.type).to.equal(34);
            expect(result.temporaryChannelId.toString("hex")).to.equal("0000000000000000000000000000000000000000000000000000000000000000"); // prettier-ignore
            expect(result.fundingTxId.toString("hex")).to.equal("1111111111111111111111111111111111111111111111111111111111111111"); // prettier-ignore
            expect(result.fundingOutputIndex).to.equal(65535);
            expect(result.signature.toString("hex")).to.equal("22222222222222222222222222222222222222222222222222222222222222223333333333333333333333333333333333333333333333333333333333333333"); // prettier-ignore
        });
    });

    describe(".serialize", () => {
        it("should serialize a message", () => {
            const instance = new FundingCreatedMessage();
            instance.temporaryChannelId = Buffer.from("0000000000000000000000000000000000000000000000000000000000000000", "hex"); // prettier-ignore
            instance.fundingTxId = Buffer.from("1111111111111111111111111111111111111111111111111111111111111111", "hex"); // prettier-ignore
            instance.fundingOutputIndex = 65535;
            instance.signature = Buffer.from("22222222222222222222222222222222222222222222222222222222222222223333333333333333333333333333333333333333333333333333333333333333", "hex"); // prettier-ignore

            const result = instance.serialize();
            expect(result.toString("hex")).to.deep.equal(
                "002200000000000000000000000000000000000000000000000000000000000000001111111111111111111111111111111111111111111111111111111111111111ffff22222222222222222222222222222222222222222222222222222222222222223333333333333333333333333333333333333333333333333333333333333333",
            );
        });
    });
});
