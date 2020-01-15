import { expect } from "chai";
import { ReplyChannelRangeMessage } from "../../lib/messages/reply-channel-range-message";
import { RawEncodedShortIdsSerializer } from "../../lib/serialize/raw-encoded-short-ids-serializer";
import { ZlibEncodedShortIdsSerializer } from "../../lib/serialize/zlib-encoded-short-ids-serializer";
import { ShortChannelId } from "../../lib/shortchanid";

describe("ReplyChannelRangeMessage", () => {
  describe(".deserialize", () => {
    it("raw encoded standard message", () => {
      // reply_channel_range
      // 0108 - type 264
      // 43497fd7f826957108f4a30fd9cec3aeba79972084e90ead01ea330900000000 - chain_hash
      // 0018df30 - first_blocknum 1630000
      // 000007d0 - number_of_blocks 2000
      // 01 - complete true
      // 00a9 - encoded_short_chan_id len 169
      // 00 - encoded (non-zlib)
      // 18e05c0000010000 - short_channel_id (1630300, 1, 0)
      // 18e33a0000020000
      // 18e33a0000030000
      // 18e33a0000040000
      // 18e33a0000050000
      // 18e3ec0000010000
      // 18e5140000030000
      // 18e5140000040000
      // 18e5140000050000
      // 18e5140000060000
      // 18e5140000070000
      // 18e5160000010000
      // 18e5160000020000
      // 18e5160000030000
      // 18e5160000040000
      // 18e5170000060000
      // 18e5180000030000
      // 18e5180000040000
      // 18e5190000010000
      // 18e5190000020000
      // 18e51d0000040000
      const input = Buffer.from(
        "010843497fd7f826957108f4a30fd9cec3aeba79972084e90ead01ea3309000000000018df30000007d00100a90018e05c000001000018e33a000002000018e33a000003000018e33a000004000018e33a000005000018e3ec000001000018e514000003000018e514000004000018e514000005000018e514000006000018e514000007000018e516000001000018e516000002000018e516000003000018e516000004000018e517000006000018e518000003000018e518000004000018e519000001000018e519000002000018e51d0000040000",
        "hex",
      );
      const message = ReplyChannelRangeMessage.deserialize(input);

      expect(message.chainHash.toString("hex")).to.equal(
        "43497fd7f826957108f4a30fd9cec3aeba79972084e90ead01ea330900000000",
      );

      expect(message.firstBlocknum).to.equal(1630000);
      expect(message.numberOfBlocks).to.equal(2000);
      // tslint:disable-next-line: no-unused-expression
      expect(message.complete).to.be.true;

      expect(message.shortChannelIds.length).to.equal(21);

      // first 18e05c0000010000
      expect(message.shortChannelIds[0].block).to.equal(1630300);
      expect(message.shortChannelIds[0].txIdx).to.equal(1);
      expect(message.shortChannelIds[0].voutIdx).to.equal(0);

      // last 18e51d0000040000
      expect(message.shortChannelIds[20].block).to.equal(1631517);
      expect(message.shortChannelIds[20].txIdx).to.equal(4);
      expect(message.shortChannelIds[20].voutIdx).to.equal(0);
    });

    it("raw encoded timestamp tlv message", () => {
      const input = Buffer.from(
        "010843497fd7f826957108f4a30fd9cec3aeba79972084e90ead01ea3309000000000018df30000007d00100a90018e05c000001000018e33a000002000018e33a000003000018e33a000004000018e33a000005000018e3ec000001000018e514000003000018e514000004000018e514000005000018e514000006000018e514000007000018e516000001000018e516000002000018e516000003000018e516000004000018e517000006000018e518000003000018e518000004000018e519000001000018e519000002000018e51d000004000001a9005dfc854d5e1de1bc5e1896e85e1dec6c5e1dfbbe5e1896e85e1df4c55e1896e85e1e01795e1896e85e1df0525e185afa5dfcb9195e1e0aa25dfcb9195e1de1835dfcb9195e1e1d995dfcb8bf5e1de8765e1de9305dfcb8bf5e1de330000000005e1de4065dfcb8dd5e1e35fb000000005e1de8ff5dfcb919000000005e1de8605e13c6f9000000005dfcb9735e1de2435dfcb9cd5e185df05e1de6615dfcb9cd5e1defc05dfcba45",
        "hex",
      );
      const message = ReplyChannelRangeMessage.deserialize(input);

      expect(message.chainHash.toString("hex")).to.equal(
        "43497fd7f826957108f4a30fd9cec3aeba79972084e90ead01ea330900000000",
      );

      expect(message.firstBlocknum).to.equal(1630000);
      expect(message.numberOfBlocks).to.equal(2000);
      // tslint:disable-next-line: no-unused-expression
      expect(message.complete).to.be.true;

      expect(message.shortChannelIds.length).to.equal(21);

      // first 18e05c0000010000
      expect(message.shortChannelIds[0].block).to.equal(1630300);
      expect(message.shortChannelIds[0].txIdx).to.equal(1);
      expect(message.shortChannelIds[0].voutIdx).to.equal(0);

      // last 18e51d0000040000
      expect(message.shortChannelIds[20].block).to.equal(1631517);
      expect(message.shortChannelIds[20].txIdx).to.equal(4);
      expect(message.shortChannelIds[20].voutIdx).to.equal(0);

      expect(message.timestamps.timestamps.length).to.equal(21);
      expect(message.timestamps.timestamps[0][0]).to.equal(1576830285);
      expect(message.timestamps.timestamps[0][1]).to.equal(1579016636);
      expect(message.timestamps.timestamps[20][0]).to.equal(1579020224);
      expect(message.timestamps.timestamps[20][1]).to.equal(1576843845);
    });

    it("zlib encoded standard message", () => {
      const payload = Buffer.from(
        "010843497fd7f826957108f4a30fd9cec3aeba79972084e90ead01ea3309000000000018e05c000004c201004f01789c2dccc10d80300c4351435b580095f4d0453a0bc323216e0c81d2fcd3931c3b765fd222d933a41513662cee17bdf788bb9bb1e086bb5be9d7f8eb269cbb93be911b7963d7d8f599ff9faf187c",
        "hex",
      );
      // 0108 - type 264
      // 43497fd7f826957108f4a30fd9cec3aeba79972084e90ead01ea330900000000 -- chain_hash
      // 0018e05c - first blocknum 1630300
      // 000004c2 - number_of_blocks 1218
      // 01 - complete true
      // 004f - length 79
      // 01 - zlib encoding
      // 789c2dccc10d80300c4351435b580095f4d0453a0bc323216e0c81d2fcd3931c3b765fd222d933a41513662cee17bdf788bb9bb1e086bb5be9d7f8eb269cbb93be911b7963d7d8f599ff9faf187c

      const msg = ReplyChannelRangeMessage.deserialize(payload);

      expect(msg.type).to.equal(264);
      expect(msg.chainHash.toString("hex")).to.equal(
        "43497fd7f826957108f4a30fd9cec3aeba79972084e90ead01ea330900000000",
      );
      expect(msg.firstBlocknum).to.equal(1630300);
      expect(msg.numberOfBlocks).to.equal(1218);
      // tslint:disable-next-line: no-unused-expression
      expect(msg.complete).to.be.true;

      expect(msg.shortChannelIds.length).to.equal(21);

      // first 18e05c0000010000
      expect(msg.shortChannelIds[0].block).to.equal(1630300);
      expect(msg.shortChannelIds[0].txIdx).to.equal(1);
      expect(msg.shortChannelIds[0].voutIdx).to.equal(0);

      // last 18e51d0000040000
      expect(msg.shortChannelIds[20].block).to.equal(1631517);
      expect(msg.shortChannelIds[20].txIdx).to.equal(4);
      expect(msg.shortChannelIds[20].voutIdx).to.equal(0);
    });

    it("zlib encoded timestamp tlv message", () => {
      const payload = Buffer.from(
        "010843497fd7f826957108f4a30fd9cec3aeba79972084e90ead01ea3309000000000018e05c000004c201004f01789c2dccc10d80300c4351435b580095f4d0453a0bc323216e0c81d2fcd3931c3b765fd222d933a41513662cee17bdf788bb9bb1e086bb5be9d7f8eb269cbb93be911b7963d7d8f599ff9faf187c018701789c8bfdd3ea1b27fb704f9cc4b41771b26f72e2647fef83b0bf1c05d3728c9510fe87a03889a85fb17f764ac6c9712d02d3b20f9b217cd999b17f76ec8f937d511627fbd200c27e6cc0000471b24fd880fcbb7172a6bf21fc17ff417aa0ec8438e1633f416ca058719cec2367207d364e22f6439cecb344305bf6fd81d83fbb5c0152f04c8a",
        "hex",
      );

      const msg = ReplyChannelRangeMessage.deserialize(payload);

      expect(msg.type).to.equal(264);
      expect(msg.chainHash.toString("hex")).to.equal(
        "43497fd7f826957108f4a30fd9cec3aeba79972084e90ead01ea330900000000",
      );
      expect(msg.firstBlocknum).to.equal(1630300);
      expect(msg.numberOfBlocks).to.equal(1218);
      // tslint:disable-next-line: no-unused-expression
      expect(msg.complete).to.be.true;

      expect(msg.shortChannelIds.length).to.equal(21);

      // first 18e05c0000010000
      expect(msg.shortChannelIds[0].block).to.equal(1630300);
      expect(msg.shortChannelIds[0].txIdx).to.equal(1);
      expect(msg.shortChannelIds[0].voutIdx).to.equal(0);

      // last 18e51d0000040000
      expect(msg.shortChannelIds[20].block).to.equal(1631517);
      expect(msg.shortChannelIds[20].txIdx).to.equal(4);
      expect(msg.shortChannelIds[20].voutIdx).to.equal(0);

      expect(msg.timestamps.timestamps.length).to.equal(21);
      expect(msg.timestamps.timestamps[0][0]).to.equal(1576830285);
      expect(msg.timestamps.timestamps[0][1]).to.equal(1579016636);
      expect(msg.timestamps.timestamps[20][0]).to.equal(1579020224);
      expect(msg.timestamps.timestamps[20][1]).to.equal(1576843845);
    });
  });

  describe(".serialize", () => {
    it("raw encoded standard message", () => {
      const message = new ReplyChannelRangeMessage();
      message.chainHash = Buffer.from(
        "43497fd7f826957108f4a30fd9cec3aeba79972084e90ead01ea330900000000",
        "hex",
      );
      message.firstBlocknum = 1630000;
      message.numberOfBlocks = 2000;
      message.complete = true;
      message.shortChannelIds.push(new ShortChannelId(1630300, 1, 0)); // 18e05c0000010000
      message.shortChannelIds.push(new ShortChannelId(1631517, 4, 0)); // 18e51d0000040000
      expect(message.serialize(new RawEncodedShortIdsSerializer()).toString("hex")).to.equal(
        "010843497fd7f826957108f4a30fd9cec3aeba79972084e90ead01ea3309000000000018df30000007d00100110018e05c000001000018e51d0000040000",
      );
    });

    it("zlib encoded standard message", () => {
      const message = new ReplyChannelRangeMessage();
      message.chainHash = Buffer.from(
        "43497fd7f826957108f4a30fd9cec3aeba79972084e90ead01ea330900000000",
        "hex",
      );
      message.firstBlocknum = 1630300;
      message.numberOfBlocks = 1218;
      message.complete = true;
      message.shortChannelIds.push(new ShortChannelId(1630300, 1, 0));
      message.shortChannelIds.push(new ShortChannelId(1631034, 2, 0));
      message.shortChannelIds.push(new ShortChannelId(1631034, 3, 0));
      message.shortChannelIds.push(new ShortChannelId(1631034, 4, 0));
      message.shortChannelIds.push(new ShortChannelId(1631034, 5, 0));
      message.shortChannelIds.push(new ShortChannelId(1631212, 1, 0));
      message.shortChannelIds.push(new ShortChannelId(1631508, 3, 0));
      message.shortChannelIds.push(new ShortChannelId(1631508, 4, 0));
      message.shortChannelIds.push(new ShortChannelId(1631508, 5, 0));
      message.shortChannelIds.push(new ShortChannelId(1631508, 6, 0));
      message.shortChannelIds.push(new ShortChannelId(1631508, 7, 0));
      message.shortChannelIds.push(new ShortChannelId(1631510, 1, 0));
      message.shortChannelIds.push(new ShortChannelId(1631510, 2, 0));
      message.shortChannelIds.push(new ShortChannelId(1631510, 3, 0));
      message.shortChannelIds.push(new ShortChannelId(1631510, 4, 0));
      message.shortChannelIds.push(new ShortChannelId(1631511, 6, 0));
      message.shortChannelIds.push(new ShortChannelId(1631512, 3, 0));
      message.shortChannelIds.push(new ShortChannelId(1631512, 4, 0));
      message.shortChannelIds.push(new ShortChannelId(1631513, 1, 0));
      message.shortChannelIds.push(new ShortChannelId(1631513, 2, 0));
      message.shortChannelIds.push(new ShortChannelId(1631517, 4, 0));

      expect(message.serialize(new ZlibEncodedShortIdsSerializer()).toString("hex")).to.equal(
        "010843497fd7f826957108f4a30fd9cec3aeba79972084e90ead01ea3309000000000018e05c000004c201004f01789c2dccc10d80300c4351435b580095f4d0453a0bc323216e0c81d2fcd3931c3b765fd222d933a41513662cee17bdf788bb9bb1e086bb5be9d7f8eb269cbb93be911b7963d7d8f599ff9faf187c",
      );
    });
  });
});
