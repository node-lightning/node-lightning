import { expect } from "chai";
import { QueryShortChannelIdsFlag } from "../../../lib/messages/tlvs/query-short-channel-ids-flag";

describe("QueryShortChannelIdFlag", () => {
  const sut = new QueryShortChannelIdsFlag();

  const tests = [
    ["setChannelAnnouncement", "channelAnnouncement"],
    ["setNode1ChannelUpdate", "node1ChannelUpdate"],
    ["setNode2ChannelUpdate", "node2ChannelUpdate"],
    ["setNode1Announcement", "node1Announcement"],
    ["setNode2Announcement", "node2Announcement"],
  ] as any[];

  for (const [fn, getter, bit] of tests) {
    it(`${fn} initially false`, () => {
      expect(sut[getter]).to.equal(false);
    });

    it(`${fn} true`, () => {
      sut[fn](true);
      expect(sut[getter]).to.equal(true);
    });

    it(`${fn} false`, () => {
      sut[fn](false);
      expect(sut[getter]).to.equal(false);
    });

    it(`${fn} fluent`, () => {
      const result = sut[fn](true);
      expect(result).to.equal(sut);
    });
  }
});
