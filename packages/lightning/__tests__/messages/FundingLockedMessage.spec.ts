import { ChannelId } from "../../lib/domain/ChannelId";
import { expect } from "chai";
import { FundingLockedMessage } from "../../lib/messages/FundingLockedMessage";

describe("FundingLockedMessage", () => {
    describe(".deserialize", () => {
        it("should deserialize without error", () => {
            const input = Buffer.from("00240000000000000000000000000000000000000000000000000000000000000000222222222222222222222222222222222222222222222222222222222222222222", "hex"); // prettier-ignore
            const result = FundingLockedMessage.deserialize(input);
            expect(result.type).to.equal(36);
            expect(result.channelId.toString()).to.equal("0000000000000000000000000000000000000000000000000000000000000000"); // prettier-ignore
            expect(result.nextPerCommitmentPoint.toString("hex")).to.equal("222222222222222222222222222222222222222222222222222222222222222222"); // prettier-ignore
        });
    });

    describe(".serialize", () => {
        it("should serialize a message", () => {
            const instance = new FundingLockedMessage();
            instance.channelId = new ChannelId(Buffer.from("0000000000000000000000000000000000000000000000000000000000000000", "hex")); // prettier-ignore
            instance.nextPerCommitmentPoint = Buffer.from("222222222222222222222222222222222222222222222222222222222222222222", "hex"); // prettier-ignore

            const result = instance.serialize();
            expect(result.toString("hex")).to.deep.equal(
                "00240000000000000000000000000000000000000000000000000000000000000000222222222222222222222222222222222222222222222222222222222222222222",
            );
        });
    });
});
