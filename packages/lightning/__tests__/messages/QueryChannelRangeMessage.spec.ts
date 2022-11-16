import { expect } from "chai";
import { QueryChannelRangeMessage } from "../../lib/messages/QueryChannelRangeMessage";

describe("QueryChannelRangeMessage", () => {
    describe(".deserialize", () => {
        it("standard message", () => {
            const payload = Buffer.from("010743497fd7f826957108f4a30fd9cec3aeba79972084e90ead01ea3309000000000018df30000007d0", "hex"); // prettier-ignore
            // query_channel_range
            // 0107 - type 263
            // 43497fd7f826957108f4a30fd9cec3aeba79972084e90ead01ea330900000000 - chain_hash
            // 0018df30 - first_blocknum 1630000
            // 000007d0 - number_of_blocks 2000
            const msg = QueryChannelRangeMessage.deserialize(payload);
            expect(msg.type).to.equal(263);
            expect(msg.chainHash.toString("hex")).to.equal("43497fd7f826957108f4a30fd9cec3aeba79972084e90ead01ea330900000000"); // prettier-ignore
            expect(msg.firstBlocknum).to.equal(1630000);
            expect(msg.numberOfBlocks).to.equal(2000);
        });

        it("message with timestamp option", () => {
            const payload = Buffer.from("010743497fd7f826957108f4a30fd9cec3aeba79972084e90ead01ea3309000000000018df30000007d0010101", "hex"); // prettier-ignore
            // query_channel_range
            // 0107 - type 263
            // 43497fd7f826957108f4a30fd9cec3aeba79972084e90ead01ea330900000000 - chain_hash
            // 0018df30 - first_blocknum 1630000
            // 000007d0 - number_of_blocks 2000
            // 01 - TLV type 1
            // 01 - TLV length 1 byte
            // 01 - query option bitmask enable timestamp
            const msg = QueryChannelRangeMessage.deserialize(payload);
            expect(msg.type).to.equal(263);
            expect(msg.chainHash.toString("hex")).to.equal("43497fd7f826957108f4a30fd9cec3aeba79972084e90ead01ea330900000000"); // prettier-ignore
            expect(msg.firstBlocknum).to.equal(1630000);
            expect(msg.numberOfBlocks).to.equal(2000);
            expect(msg.timestamps).to.equal(true);
        });

        it("message with timestamp and checksum options", () => {
            const payload = Buffer.from("010743497fd7f826957108f4a30fd9cec3aeba79972084e90ead01ea3309000000000018df30000007d0010103", "hex"); // prettier-ignore
            // query_channel_range
            // 0107 - type 263
            // 43497fd7f826957108f4a30fd9cec3aeba79972084e90ead01ea330900000000 - chain_hash
            // 0018df30 - first_blocknum 1630000
            // 000007d0 - number_of_blocks 2000
            // 01 - TLV type 1
            // 01 - TLV length 1 byte
            // 03 - query option bitmask enable timestamp and checksum
            const msg = QueryChannelRangeMessage.deserialize(payload);
            expect(msg.type).to.equal(263);
            expect(msg.chainHash.toString("hex")).to.equal("43497fd7f826957108f4a30fd9cec3aeba79972084e90ead01ea330900000000"); // prettier-ignore
            expect(msg.firstBlocknum).to.equal(1630000);
            expect(msg.numberOfBlocks).to.equal(2000);
            expect(msg.timestamps).to.equal(true);
            expect(msg.checksums).to.equal(true);
        });
    });

    describe(".serialize", () => {
        it("standard message", () => {
            const msg = new QueryChannelRangeMessage();
            msg.chainHash = Buffer.from(
                "43497fd7f826957108f4a30fd9cec3aeba79972084e90ead01ea330900000000",
                "hex",
            );
            msg.firstBlocknum = 1630000;
            msg.numberOfBlocks = 2000;
            expect(msg.serialize().toString("hex")).to.equal(
                "010743497fd7f826957108f4a30fd9cec3aeba79972084e90ead01ea3309000000000018df30000007d0",
            );
        });

        it("message with timestamp option", () => {
            const msg = new QueryChannelRangeMessage();
            msg.chainHash = Buffer.from(
                "43497fd7f826957108f4a30fd9cec3aeba79972084e90ead01ea330900000000",
                "hex",
            );
            msg.firstBlocknum = 1630000;
            msg.numberOfBlocks = 2000;
            msg.checksums = true;
            expect(msg.serialize().toString("hex")).to.equal(
                "010743497fd7f826957108f4a30fd9cec3aeba79972084e90ead01ea3309000000000018df30000007d0010102",
            );
        });

        it("message with timestamp and checksum option", () => {
            const msg = new QueryChannelRangeMessage();
            msg.chainHash = Buffer.from(
                "43497fd7f826957108f4a30fd9cec3aeba79972084e90ead01ea330900000000",
                "hex",
            );
            msg.firstBlocknum = 1630000;
            msg.numberOfBlocks = 2000;
            msg.checksums = true;
            msg.timestamps = true;
            expect(msg.serialize().toString("hex")).to.equal(
                "010743497fd7f826957108f4a30fd9cec3aeba79972084e90ead01ea3309000000000018df30000007d0010103",
            );
        });
    });
});
