import { expect } from "chai";
import { QueryShortChannelIdsMessage } from "../../lib/messages/query-short-channel-ids-message";
import { ShortChannelId } from "../../lib/shortchanid";

describe("QueryShortChannelIdsMessage", () => {
  describe(".deserialize", () => {
    it("standard message", () => {
      const payload = Buffer.from("010543497fd7f826957108f4a30fd9cec3aeba79972084e90ead01ea33090000000000110018e05c000001000018e51d0000040000", "hex"); // prettier-ignore
      // 010543497fd7f826957108f4a30fd9cec3aeba79972084e90ead01ea33090000000000110018e05c000001000018e51d0000040000
      // query_short_channel_ids
      // 0105 - type 261
      // 43497fd7f826957108f4a30fd9cec3aeba79972084e90ead01ea330900000000 - chain_hash
      // 0011 - len 17
      // 00 - encoded_short_channel_id encoding type
      // 18e05c0000010000 - short_channel_id (1630300, 1, 0)
      // 18e51d0000040000 - short_channel_id (1631517, 4, 0)
      const msg = QueryShortChannelIdsMessage.deserialize(payload);
      expect(msg.type).to.equal(261);
      expect(msg.chainHash.toString("hex")).to.equal("43497fd7f826957108f4a30fd9cec3aeba79972084e90ead01ea330900000000"); // prettier-ignore
      expect(msg.shortChannelIds.length).to.equal(2);
      expect(msg.shortChannelIds[0].block).to.equal(1630300);
      expect(msg.shortChannelIds[0].txIdx).to.equal(1);
      expect(msg.shortChannelIds[0].voutIdx).to.equal(0);
      expect(msg.shortChannelIds[1].block).to.equal(1631517);
      expect(msg.shortChannelIds[1].txIdx).to.equal(4);
      expect(msg.shortChannelIds[1].voutIdx).to.equal(0);
    });
  });

  describe(".serialize", () => {
    describe("standard message", () => {
      const msg = new QueryShortChannelIdsMessage();
      msg.chainHash = Buffer.from(
        "43497fd7f826957108f4a30fd9cec3aeba79972084e90ead01ea330900000000",
        "hex",
      );
      msg.shortChannelIds.push(new ShortChannelId(1630300, 1, 0));
      msg.shortChannelIds.push(new ShortChannelId(1631517, 4, 0));
      expect(msg.serialize().toString("hex")).to.equal(
        "010543497fd7f826957108f4a30fd9cec3aeba79972084e90ead01ea33090000000000110018e05c000001000018e51d0000040000",
      );
    });
  });
});
