import { expect } from "chai";
import { QueryChannelRangeMessage } from "../../lib/messages/query-channel-range-message";

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
  });

  describe(".serialize", () => {
    describe("standard message", () => {
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
  });
});
