import { ChannelId } from "@node-lightning/core";
import { expect } from "chai";
import { ShutdownMessage } from "../../lib/messages/ShutdownMessage";

describe("ShutdownChannelMessage", () => {
    describe(".deserialize", () => {
        it("should deserialize without error", () => {
            const input = Buffer.from(
                "0026"+ // type
                "0000000000000000000000000000000000000000000000000000000000000000" +    // Channel ID
                "0015" +  //len
                "00a41a8527eab06efc0a8df57045d247784a071e23" //p2wpkh 
                 ,"hex"); // prettier-ignore
            const result = ShutdownMessage.deserialize(input);
            expect(result.type).to.equal(38);
            expect(result.channelId.toString()).to.equal("0000000000000000000000000000000000000000000000000000000000000000"); // prettier-ignore
            expect(result.len).to.equal(21);
            expect(result.scriptPubKey.toString("hex")).to.equal("00a41a8527eab06efc0a8df57045d247784a071e23"); // prettier-ignore
        });
    });
    describe(".serialize", () => {
        it("should serialize a message", () => {
            const instance = new ShutdownMessage();
            instance.channelId = new ChannelId(Buffer.from("0000000000000000000000000000000000000000000000000000000000000000", "hex")); // prettier-ignore
            instance.len = 21;
            instance.scriptPubKey = Buffer.from("00a41a8527eab06efc0a8df57045d247784a071e23", "hex"); // prettier-ignore

            const result = instance.serialize();
            expect(result.toString("hex")).to.equal(
                "0026" +
                    "0000000000000000000000000000000000000000000000000000000000000000" +
                    "0015" +
                    "00a41a8527eab06efc0a8df57045d247784a071e23",
            );
        });
    });
});
