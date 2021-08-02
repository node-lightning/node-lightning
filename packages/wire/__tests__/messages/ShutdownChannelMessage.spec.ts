import { ChannelId } from "@node-lightning/core";
import { expect } from "chai";
import { ShutdownMessage } from "../../lib/messages/ShutdownMessage";

describe("ShutdownChannelMessage", () => {
    describe(".deserialize", () => {
        it("should deserialize without error", () => {
            const input = Buffer.from(
                "0026"+ // type
                "0000000000000000000000000000000000000000000000000000000000000000" +    // Channel ID
                "6a47304402207899531a52d59a6de200179928ca900254a36b8dff8bb75f5f5d71b1cdc26125022008b422690b8461cb52c3cc30330b23d574351872b7c361e9aae3649071c1a7160121035d5c93d9ac96881f19ba1f686f15f009ded7c62efe85a872e6a19b43c15a2937" //ScriptPubKey
                 ,"hex"); // prettier-ignore
            const result = ShutdownMessage.deserialize(input);
            expect(result.type).to.equal(38);
            expect(result.channelId.toString()).to.equal("0000000000000000000000000000000000000000000000000000000000000000"); // prettier-ignore
            expect(result.scriptPubKey.toString("hex")).to.equal("6a47304402207899531a52d59a6de200179928ca900254a36b8dff8bb75f5f5d71b1cdc26125022008b422690b8461cb52c3cc30330b23d574351872b7c361e9aae3649071c1a7160121035d5c93d9ac96881f19ba1f686f15f009ded7c62efe85a872e6a19b43c15a2937"); // prettier-ignore
        });
    });
    describe(".serialize", () => {
        it("should serialize a message", () => {
            const instance = new ShutdownMessage();
            instance.channelId = new ChannelId(Buffer.from("0000000000000000000000000000000000000000000000000000000000000000", "hex")); // prettier-ignore
            instance.scriptPubKey = Buffer.from("6a47304402207899531a52d59a6de200179928ca900254a36b8dff8bb75f5f5d71b1cdc26125022008b422690b8461cb52c3cc30330b23d574351872b7c361e9aae3649071c1a7160121035d5c93d9ac96881f19ba1f686f15f009ded7c62efe85a872e6a19b43c15a2937", "hex"); // prettier-ignore

            const result = instance.serialize();
            expect(result.toString("hex")).to.equal(
                "0026" +
                    "0000000000000000000000000000000000000000000000000000000000000000" +
                    "6a47304402207899531a52d59a6de200179928ca900254a36b8dff8bb75f5f5d71b1cdc26125022008b422690b8461cb52c3cc30330b23d574351872b7c361e9aae3649071c1a7160121035d5c93d9ac96881f19ba1f686f15f009ded7c62efe85a872e6a19b43c15a2937",
            );
        });
    });
});
