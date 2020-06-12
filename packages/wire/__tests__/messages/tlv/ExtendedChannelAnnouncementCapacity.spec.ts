import { expect } from "chai";
import { ExtendedChannelAnnouncementCapacity } from "../../../lib/messages/tlvs/ExtendedChannelAnnouncementCapacity";
import { TlvValueReader } from "../../../lib/serialize/TlvValueReader";

describe("ExtendedChannelAnnouncementCapacity", () => {
    describe(".serializeValue()", () => {
        it("should create buffer", () => {
            const sut = new ExtendedChannelAnnouncementCapacity();
            sut.capacity = BigInt(1234);
            const actual = sut.serializeValue();
            expect(actual.toString("hex")).to.equal("04d2");
        });
    });

    describe(".serialize()", () => {
        it("should create full TLV buffer", () => {
            const sut = new ExtendedChannelAnnouncementCapacity();
            sut.capacity = BigInt(1234);
            const actual = sut.serialize();
            expect(actual.toString("hex")).to.equal(
        "fe01000039" + // type (16777273)
        "02" + // length (2)
        "04d2", // value
      ); // prettier-ignore
        });
    });

    describe(".deserialize", () => {
        it("should create instance", () => {
            const payload = Buffer.from("04d2", "hex");
            const reader = new TlvValueReader(payload);
            const actual = ExtendedChannelAnnouncementCapacity.deserialize(reader);
            expect(actual.capacity).to.equal(BigInt(1234));
        });
    });
});
