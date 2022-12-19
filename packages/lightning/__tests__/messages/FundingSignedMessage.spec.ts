import { ChannelId } from "../../lib/domain/ChannelId";
import { expect } from "chai";
import { FundingSignedMessage } from "../../lib/messages/FundingSignedMessage";
import { EcdsaSig } from "@node-lightning/bitcoin";

describe("FundingSignedMessage", () => {
    describe(".deserialize", () => {
        it("should deserialize without error", () => {
            const input = Buffer.from("0023000000000000000000000000000000000000000000000000000000000000000022222222222222222222222222222222222222222222222222222222222222223333333333333333333333333333333333333333333333333333333333333333", "hex"); // prettier-ignore
            const result = FundingSignedMessage.deserialize(input);
            expect(result.type).to.equal(35);
            expect(result.channelId.toString()).to.equal("0000000000000000000000000000000000000000000000000000000000000000"); // prettier-ignore
            expect(result.signature.toBuffer().toString("hex")).to.equal("22222222222222222222222222222222222222222222222222222222222222223333333333333333333333333333333333333333333333333333333333333333"); // prettier-ignore
        });
    });

    describe(".serialize", () => {
        it("should serialize a message", () => {
            const instance = new FundingSignedMessage();
            instance.channelId = new ChannelId(Buffer.from("0000000000000000000000000000000000000000000000000000000000000000", "hex")); // prettier-ignore
            instance.signature = new EcdsaSig(Buffer.from("22222222222222222222222222222222222222222222222222222222222222223333333333333333333333333333333333333333333333333333333333333333", "hex")); // prettier-ignore

            const result = instance.serialize();
            expect(result.toString("hex")).to.deep.equal(
                "0023000000000000000000000000000000000000000000000000000000000000000022222222222222222222222222222222222222222222222222222222222222223333333333333333333333333333333333333333333333333333333333333333",
            );
        });
    });
});
