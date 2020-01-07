import { expect } from "chai";
import { ReplyChannelRangeMessage } from "../../lib/messages/reply-channel-range-message";

describe("ReplyChannelRangeMessage", () => {
  describe(".deserialize", () => {
    describe("complete values", () => {
      const input = Buffer.from(
        "0108a48effd2c7415a1066b566f3f5e231d356e9b73cec19f9ec1b020000000000000018df30000007d00100a90018e05c000001000018e33a000002000018e33a000003000018e33a000004000018e33a000005000018e3ec000001000018e514000003000018e514000004000018e514000005000018e514000006000018e514000007000018e516000001000018e516000002000018e516000003000018e516000004000018e517000006000018e518000003000018e518000004000018e519000001000018e519000002000018e51d0000040000",
        "hex",
      );
      let message: ReplyChannelRangeMessage;

      before(() => {
        message = ReplyChannelRangeMessage.deserialize(input);
      });

      it("should include chainHash", () => {
        expect(message.chainHash.toString("hex")).to.equal(
          "a48effd2c7415a1066b566f3f5e231d356e9b73cec19f9ec1b02000000000000",
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
});
