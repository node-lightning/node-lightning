import { expect } from "chai";
import { ReplyShortChannelIdsEndMessage } from "../../lib/messages/ReplyShortChannelIdsEndMessage";

describe("ReplyShortChannelIdsEndMessage", () => {
    describe(".deserialize", () => {
        it("standard message", () => {
            const payload = Buffer.from("010643497fd7f826957108f4a30fd9cec3aeba79972084e90ead01ea33090000000001", "hex"); // prettier-ignore
            // reply_short_channel_ids_end
            // 010643497fd7f826957108f4a30fd9cec3aeba79972084e90ead01ea33090000000001
            // 0106 - type 262
            // 43497fd7f826957108f4a30fd9cec3aeba79972084e90ead01ea330900000000 - chain_hash
            // 01 - complete true

            const msg = ReplyShortChannelIdsEndMessage.deserialize(payload);
            expect(msg.type).to.equal(262);
            expect(msg.chainHash.toString("hex")).to.equal("43497fd7f826957108f4a30fd9cec3aeba79972084e90ead01ea330900000000"); // prettier-ignore
            // tslint:disable-next-line: no-unused-expression
            expect(msg.complete).to.be.true;
        });
    });

    describe(".serialize", () => {
        describe("standard message", () => {
            const msg = new ReplyShortChannelIdsEndMessage();
            msg.chainHash = Buffer.from(
                "43497fd7f826957108f4a30fd9cec3aeba79972084e90ead01ea330900000000",
                "hex",
            );
            msg.complete = true;
            expect(msg.serialize().toString("hex")).to.equal(
                "010643497fd7f826957108f4a30fd9cec3aeba79972084e90ead01ea33090000000001",
            );
        });
    });
});
