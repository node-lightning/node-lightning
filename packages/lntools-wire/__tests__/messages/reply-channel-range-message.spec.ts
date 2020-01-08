import { expect } from "chai";
import { ReplyChannelRangeMessage } from "../../lib/messages/reply-channel-range-message";
import { ShortChannelId } from "../../lib/shortchanid";

describe("ReplyChannelRangeMessage", () => {
  describe(".deserialize", () => {
    describe("non-TLV", () => {
      const input = Buffer.from(
        "010843497fd7f826957108f4a30fd9cec3aeba79972084e90ead01ea3309000000000018df30000007d00100a90018e05c000001000018e33a000002000018e33a000003000018e33a000004000018e33a000005000018e3ec000001000018e514000003000018e514000004000018e514000005000018e514000006000018e514000007000018e516000001000018e516000002000018e516000003000018e516000004000018e517000006000018e518000003000018e518000004000018e519000001000018e519000002000018e51d0000040000",
        "hex",
      );
      let message: ReplyChannelRangeMessage;

      before(() => {
        message = ReplyChannelRangeMessage.deserialize(input);
      });

      it("should include chainHash", () => {
        expect(message.chainHash.toString("hex")).to.equal(
          "43497fd7f826957108f4a30fd9cec3aeba79972084e90ead01ea330900000000",
        );
      });

      it("should include firstBlockNum", () => {
        expect(message.firstBlocknum).to.equal(1630000);
      });

      it("should include numberOfBlocks", () => {
        expect(message.numberOfBlocks).to.equal(2000);
      });

      it("should include complete", () => {
        // tslint:disable-next-line: no-unused-expression
        expect(message.complete).to.be.true;
      });

      it("should include short_channel_ids", () => {
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
    });
  });

  describe(".serialize", () => {
    it("should serialize", () => {
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
      expect(message.serialize().toString("hex")).to.equal(
        "010843497fd7f826957108f4a30fd9cec3aeba79972084e90ead01ea3309000000000018df30000007d00100110018e05c000001000018e51d0000040000",
      );
    });
  });
});
