import { ChannelId, Value } from "@node-lightning/core";
import { expect } from "chai";
import { ClosingSignedMessage } from "../../lib/messages/ClosingSignedMessage";

describe("ClosingSignedMessage", () => {
    describe(".deserialize", () => {
        it("should deserialize without error", () => {
            const input = Buffer.from(
                "0027"+ // type
                "0000000000000000000000000000000000000000000000000000000000000000" +    // Channel ID
                "0000000000030d40" + // feeSatoshi
                "22222222222222222222222222222222222222222222222222222222222222223333333333333333333333333333333333333333333333333333333333333333" //signature
                , "hex"); // prettier-ignore
            const result = ClosingSignedMessage.deserialize(input);
            expect(result.type).to.equal(39);
            expect(result.channelId.toString()).to.equal("0000000000000000000000000000000000000000000000000000000000000000"); // prettier-ignore
            expect(result.feeSatoshis.sats).to.equal(BigInt(200000));
            expect(result.signature.toString("hex")).to.equal("22222222222222222222222222222222222222222222222222222222222222223333333333333333333333333333333333333333333333333333333333333333"); // prettier-ignore
        });
    });

    describe(".serialize", () => {
        it("should serialize a message", () => {
            const instance = new ClosingSignedMessage();
            instance.channelId = new ChannelId(Buffer.from("0000000000000000000000000000000000000000000000000000000000000000", "hex")); // prettier-ignore
            instance.feeSatoshis = Value.fromSats(200000);
            instance.signature = Buffer.from("22222222222222222222222222222222222222222222222222222222222222223333333333333333333333333333333333333333333333333333333333333333", "hex"); // prettier-ignore

            const result = instance.serialize();
            expect(result.toString("hex")).to.equal(
                "002700000000000000000000000000000000000000000000000000000000000000000000000000030d4022222222222222222222222222222222222222222222222222222222222222223333333333333333333333333333333333333333333333333333333333333333",
            );
        });
    });
});
