import * as crypto from "@node-lightning/crypto";
import { expect } from "chai";
import { ShutdownMessage } from "../../lib/messages/ShutdownMessage";

describe("ShutdownChannelMessage", () => {
    describe("serialize", () => {
        it("serializes with P2PKH", () => {
            const instance = new ShutdownMessage();
            instance.channelId = Buffer.from(
                "0000000000000000000000000000000000000000000000000000000000000000",
                "hex",
            );
            instance.len = Buffer.from("00".repeat(16), "hex");
            instance.scriptPubKey = Buffer.from(
                "OP_DUP OP_HASH160 0000000000000000000000000000000000000000 OP_EQUALVERIFY OP_CHECKSIG",
            );

            expect(instance.serialize().toString("hex")).to.equal(
                "0026" + // type
                "0000000000000000000000000000000000000000000000000000000000000000" + // temp_chan_id
                "0000000000000000" + // len
                "0000OP_DUP OP_HASH160 0000000000000000000000000000000000000000 OP_EQUALVERIFY OP_CHECKSIG000000004e20" // scriptPubKey
            ); // prettier-ignore
        });
    });
    describe("deserialize", () => {
        it("should deserialize without error", () => {
            const buf = Buffer.from(
                "0026" + // type
                "0000000000000000000000000000000000000000000000000000000000000000" + // temp_chan_id
                "0000000000000000" + // len
                "0000OP_DUP OP_HASH160 0000000000000000000000000000000000000000 OP_EQUALVERIFY OP_CHECKSIG000000004e20", "hex" // scriptPubKey
            ); // prettier-ignore

            const instance = ShutdownMessage.deserialize(buf);
            expect(instance.type).to.equal(38);
            expect(instance.channelId.toString("hex")).to.equal(
                "0000000000000000000000000000000000000000000000000000000000000000",
            );
            expect(instance.len.toString("hex")).to.equal("0000000000000000");
            expect(instance.scriptPubKey.toString()).to.equal(
                "0000OP_DUP OP_HASH160 0000000000000000000000000000000000000000 OP_EQUALVERIFY OP_CHECKSIG000000004e20",
            );
        });
    });
});
