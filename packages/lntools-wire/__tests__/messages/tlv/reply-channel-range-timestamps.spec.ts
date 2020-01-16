import { expect } from "chai";
import { ReplyChannelRangeTimestamps } from "../../../lib/messages/tlvs/reply-channel-range-timestamps";
import { TlvValueReader } from "../../../lib/serialize/tlv-value-reader";

describe("ReplyChannelRangeTimestamps", () => {
  describe(".deserialize()", () => {
    it("raw encoded messsage", () => {
      const input = Buffer.from(
        "005dfc854d5e1de1bc5e1896e85e1dec6c5e1dfbbe5e1896e85e1df4c55e1896e85e1e01795e1896e85e1df0525e185afa5dfcb9195e1e0aa25dfcb9195e1de1835dfcb9195e1e1d995dfcb8bf5e1de8765e1de9305dfcb8bf5e1de330000000005e1de4065dfcb8dd5e1e35fb000000005e1de8ff5dfcb919000000005e1de8605e13c6f9000000005dfcb9735e1de2435dfcb9cd5e185df05e1de6615dfcb9cd5e1defc05dfcba45",
        "hex",
      );
      const reader = new TlvValueReader(input);
      const result = ReplyChannelRangeTimestamps.deserialize(reader);
      expect(result.timestamps.length).to.equal(21);
      expect(result.timestamps[0][0]).to.equal(1576830285);
      expect(result.timestamps[0][1]).to.equal(1579016636);
      expect(result.timestamps[20][0]).to.equal(1579020224);
      expect(result.timestamps[20][1]).to.equal(1576843845);
    });

    it("zlib encoded message", () => {
      const input = Buffer.from(
        "01789c8bfdd3ea1b27fb704f9cc4b41771b26f72e2647fef83b0bf1c05d3728c9510fe87a03889a85fb17f764ac6c9712d02d3b20f9b217cd999b17f76ec8f937d511627fbd200c27e6cc0000471b24fd880fcbb7172a6bf21fc17ff417aa0ec8438e1633f416ca058719cec2367207d364e22f6439cecb344305bf6fd81d83fbb5c0152f04c8a",
        "hex",
      );
      const reader = new TlvValueReader(input);
      const result = ReplyChannelRangeTimestamps.deserialize(reader);
      expect(result.timestamps.length).to.equal(21);
      expect(result.timestamps[0][0]).to.equal(1576830285);
      expect(result.timestamps[0][1]).to.equal(1579016636);
      expect(result.timestamps[20][0]).to.equal(1579020224);
      expect(result.timestamps[20][1]).to.equal(1576843845);
    });
  });

  describe(".serializeValue()", () => {
    it("should serialize raw", () => {
      const sut = new ReplyChannelRangeTimestamps();
      sut.addChannel(0, 1);
      sut.addChannel(2, 0);
      expect(sut.serializeValue(0).toString("hex")).to.equal("0000000000000000010000000200000000");
    });

    it("should serialize zlib", () => {
      const sut = new ReplyChannelRangeTimestamps();
      sut.addChannel(0, 1);
      sut.addChannel(2, 0);
      expect(sut.serializeValue(1).toString("hex")).to.equal("01789c6360000346206602310000230004");
    });
  });

  describe(".serialize()", () => {
    it("raw encoding", () => {
      const sut = new ReplyChannelRangeTimestamps();
      sut.addChannel(0, 1);
      sut.addChannel(2, 0);
      expect(sut.serialize(0).toString("hex")).to.equal("01110000000000000000010000000200000000");
    });
    it("zlib encoding", () => {
      const sut = new ReplyChannelRangeTimestamps();
      sut.addChannel(0, 1);
      sut.addChannel(2, 0);
      expect(sut.serialize(1).toString("hex")).to.equal("011101789c6360000346206602310000230004");
    });
  });
});
