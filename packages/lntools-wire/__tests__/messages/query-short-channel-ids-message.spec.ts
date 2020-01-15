import { expect } from "chai";
import { QueryShortChannelIdsMessage } from "../../lib/messages/query-short-channel-ids-message";
import { ShortChannelId } from "../../lib/shortchanid";

describe("QueryShortChannelIdsMessage", () => {
  describe(".deserialize", () => {
    it("raw encoded standard message", () => {
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

    it("zlib encoded standard message", () => {
      const payload = Buffer.from("010543497fd7f826957108f4a30fd9cec3aeba79972084e90ead01ea330900000000004f01789c2dccc10d80300c4351435b580095f4d0453a0bc323216e0c81d2fcd3931c3b765fd222d933a41513662cee17bdf788bb9bb1e086bb5be9d7f8eb269cbb93be911b7963d7d8f599ff9faf187c", "hex"); // prettier-ignore
      // 010543497fd7f826957108f4a30fd9cec3aeba79972084e90ead01ea330900000000004f01789c2dccc10d80300c4351435b580095f4d0453a0bc323216e0c81d2fcd3931c3b765fd222d933a41513662cee17bdf788bb9bb1e086bb5be9d7f8eb269cbb93be911b7963d7d8f599ff9faf187c
      // query_short_channelids
      // 0105 - type 261
      // 43497fd7f826957108f4a30fd9cec3aeba79972084e90ead01ea330900000000 - chain_hash
      // 004f - len 79
      // 01 - encoded_short_channel_id using zlib deflate
      // 789c2dccc10d80300c4351435b580095f4d0453a0bc323216e0c81d2fcd3931c3b765fd222d933a41513662cee17bdf788bb9bb1e086bb5be9d7f8eb269cbb93be911b7963d7d8f599ff9faf187c
      const msg = QueryShortChannelIdsMessage.deserialize(payload);
      expect(msg.type).to.equal(261);
      expect(msg.chainHash.toString("hex")).to.equal("43497fd7f826957108f4a30fd9cec3aeba79972084e90ead01ea330900000000"); // prettier-ignore
      expect(msg.shortChannelIds.length).to.equal(21);
      expect(msg.shortChannelIds[0].block).to.equal(1630300);
      expect(msg.shortChannelIds[0].txIdx).to.equal(1);
      expect(msg.shortChannelIds[0].voutIdx).to.equal(0);
      expect(msg.shortChannelIds[20].block).to.equal(1631517);
      expect(msg.shortChannelIds[20].txIdx).to.equal(4);
      expect(msg.shortChannelIds[20].voutIdx).to.equal(0);
    });
  });

  describe(".serialize", () => {
    it("raw encoded standard message", () => {
      const msg = new QueryShortChannelIdsMessage();
      msg.chainHash = Buffer.from(
        "43497fd7f826957108f4a30fd9cec3aeba79972084e90ead01ea330900000000",
        "hex",
      );
      msg.shortChannelIds.push(new ShortChannelId(1630300, 1, 0));
      msg.shortChannelIds.push(new ShortChannelId(1631517, 4, 0));
      expect(msg.serialize(0).toString("hex")).to.equal(
        "010543497fd7f826957108f4a30fd9cec3aeba79972084e90ead01ea33090000000000110018e05c000001000018e51d0000040000",
      );
    });

    it("zlib encoded standard message", () => {
      const msg = new QueryShortChannelIdsMessage();
      msg.chainHash = Buffer.from(
        "43497fd7f826957108f4a30fd9cec3aeba79972084e90ead01ea330900000000",
        "hex",
      );
      msg.shortChannelIds.push(new ShortChannelId(1630300, 1, 0));
      msg.shortChannelIds.push(new ShortChannelId(1631034, 2, 0));
      msg.shortChannelIds.push(new ShortChannelId(1631034, 3, 0));
      msg.shortChannelIds.push(new ShortChannelId(1631034, 4, 0));
      msg.shortChannelIds.push(new ShortChannelId(1631034, 5, 0));
      msg.shortChannelIds.push(new ShortChannelId(1631212, 1, 0));
      msg.shortChannelIds.push(new ShortChannelId(1631508, 3, 0));
      msg.shortChannelIds.push(new ShortChannelId(1631508, 4, 0));
      msg.shortChannelIds.push(new ShortChannelId(1631508, 5, 0));
      msg.shortChannelIds.push(new ShortChannelId(1631508, 6, 0));
      msg.shortChannelIds.push(new ShortChannelId(1631508, 7, 0));
      msg.shortChannelIds.push(new ShortChannelId(1631510, 1, 0));
      msg.shortChannelIds.push(new ShortChannelId(1631510, 2, 0));
      msg.shortChannelIds.push(new ShortChannelId(1631510, 3, 0));
      msg.shortChannelIds.push(new ShortChannelId(1631510, 4, 0));
      msg.shortChannelIds.push(new ShortChannelId(1631511, 6, 0));
      msg.shortChannelIds.push(new ShortChannelId(1631512, 3, 0));
      msg.shortChannelIds.push(new ShortChannelId(1631512, 4, 0));
      msg.shortChannelIds.push(new ShortChannelId(1631513, 1, 0));
      msg.shortChannelIds.push(new ShortChannelId(1631513, 2, 0));
      msg.shortChannelIds.push(new ShortChannelId(1631517, 4, 0));
      expect(msg.serialize(1).toString("hex")).to.equal(
        "010543497fd7f826957108f4a30fd9cec3aeba79972084e90ead01ea330900000000004f01789c2dccc10d80300c4351435b580095f4d0453a0bc323216e0c81d2fcd3931c3b765fd222d933a41513662cee17bdf788bb9bb1e086bb5be9d7f8eb269cbb93be911b7963d7d8f599ff9faf187c",
      );
    });
  });
});
