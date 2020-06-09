import { expect } from "chai";
import { ReplyChannelRangeChecksums } from "../../../lib/messages/tlvs/ReplyChannelRangeChecksums";
import { TlvValueReader } from "../../../lib/serialize/tlv-value-reader";

describe("ReplyChannelRangeChecksums", () => {
  describe(".deserialize()", () => {
    it("raw message", () => {
      const payload = Buffer.from("43cf660e444c75687557813614898dff32107fd253ce731b5c882a803d562649242f4a0d45f146c41447f538f60442d805e346063b19348e63c85fedade928b006c91441b72e0d61bcd092df9e34893fb02f5fd0a8444b31bfebd06e0000000079ce4ae844013b97424cb326000000005114ef729478639700000000f428dd19671d27a900000000643769d1c6b7c9d70d96cb8ff4dfc3a0c05c8f134ba933dc3ee677e34242f2e0", "hex"); // prettier-ignore
      const reader = new TlvValueReader(payload);
      const instance = ReplyChannelRangeChecksums.deserialize(reader);
      expect(instance.checksums.length).to.equal(21);
      expect(instance.checksums[0][0]).to.equal(0x43cf660e);
      expect(instance.checksums[0][1]).to.equal(0x444c7568);
      expect(instance.checksums[20][0]).to.equal(0x3ee677e3);
      expect(instance.checksums[20][1]).to.equal(0x4242f2e0);
    });
  });

  describe(".serializeValue()", () => {
    it("raw message", () => {
      const instance = new ReplyChannelRangeChecksums();
      instance.checksums = [
        [1137665550, 1145861480],
        [1968668982, 344559103],
        [839942098, 1406038811],
        [1552427648, 1029056073],
        [607078925, 1173440196],
        [340260152, 4127474392],
        [98780678, 991507598],
        [1674076141, 2917738672],
        [113841217, 3073248609],
        [3167785695, 2654243135],
        [2955894736, 2823047985],
        [3219902574, 0],
        [2043562728, 1140931479],
        [1112322854, 0],
        [1360326514, 2490917783],
        [0, 4096318745],
        [1729963945, 0],
        [1681353169, 3333933527],
        [227986319, 4108305312],
        [3227291411, 1269380060],
        [1055291363, 1111683808],
      ];
      expect(instance.serializeValue().toString("hex")).to.equal(
        "43cf660e444c75687557813614898dff32107fd253ce731b5c882a803d562649242f4a0d45f146c41447f538f60442d805e346063b19348e63c85fedade928b006c91441b72e0d61bcd092df9e34893fb02f5fd0a8444b31bfebd06e0000000079ce4ae844013b97424cb326000000005114ef729478639700000000f428dd19671d27a900000000643769d1c6b7c9d70d96cb8ff4dfc3a0c05c8f134ba933dc3ee677e34242f2e0",
      );
    });
  });

  describe(".serialize()", () => {
    it("raw", () => {
      const instance = new ReplyChannelRangeChecksums();
      instance.checksums = [
        [1137665550, 1145861480],
        [1968668982, 344559103],
        [839942098, 1406038811],
        [1552427648, 1029056073],
        [607078925, 1173440196],
        [340260152, 4127474392],
        [98780678, 991507598],
        [1674076141, 2917738672],
        [113841217, 3073248609],
        [3167785695, 2654243135],
        [2955894736, 2823047985],
        [3219902574, 0],
        [2043562728, 1140931479],
        [1112322854, 0],
        [1360326514, 2490917783],
        [0, 4096318745],
        [1729963945, 0],
        [1681353169, 3333933527],
        [227986319, 4108305312],
        [3227291411, 1269380060],
        [1055291363, 1111683808],
      ];
      expect(instance.serialize().toString("hex")).to.equal(
        "03a843cf660e444c75687557813614898dff32107fd253ce731b5c882a803d562649242f4a0d45f146c41447f538f60442d805e346063b19348e63c85fedade928b006c91441b72e0d61bcd092df9e34893fb02f5fd0a8444b31bfebd06e0000000079ce4ae844013b97424cb326000000005114ef729478639700000000f428dd19671d27a900000000643769d1c6b7c9d70d96cb8ff4dfc3a0c05c8f134ba933dc3ee677e34242f2e0",
      );
    });
  });
});
