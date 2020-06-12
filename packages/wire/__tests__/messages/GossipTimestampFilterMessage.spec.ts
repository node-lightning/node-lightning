import { expect } from "chai";
import { GossipTimestampFilterMessage } from "../../lib/messages/GossipTimestampFilterMessage";

describe("GossipTimestampFilterMessage", () => {
    describe("serialize", () => {
        it("standard message", () => {
            const msg = new GossipTimestampFilterMessage();
            msg.chainHash = Buffer.from(
                "43497fd7f826957108f4a30fd9cec3aeba79972084e90ead01ea330900000000",
                "hex",
            );
            msg.firstTimestamp = 1578591431;
            msg.timestampRange = 4294967295;
            expect(msg.serialize().toString("hex")).to.equal(
                "010943497fd7f826957108f4a30fd9cec3aeba79972084e90ead01ea3309000000005e1764c7ffffffff",
            );
        });
    });

    describe("deserialize", () => {
        it("standard message", () => {
            const payload = Buffer.from(
                "010943497fd7f826957108f4a30fd9cec3aeba79972084e90ead01ea3309000000005e1764c7ffffffff",
                "hex",
            );
            const msg = GossipTimestampFilterMessage.deserialize(payload);
            expect(msg.chainHash.toString("hex")).to.equal(
                "43497fd7f826957108f4a30fd9cec3aeba79972084e90ead01ea330900000000",
            );
            expect(msg.firstTimestamp).to.equal(1578591431);
            expect(msg.timestampRange).to.equal(4294967295);
        });
    });
});
