import { OutPoint } from "@node-lightning/bitcoin";
import { ChannelId } from "../lib/ChannelId";
import { expect } from "chai";

describe("ChannelId", () => {
    describe("#fromOutPoint()", () => {
        it("0000000000000000000000000000000000000000000000000000000000000000:0", () => {
            const outpoint = OutPoint.fromString("0000000000000000000000000000000000000000000000000000000000000000:0"); // prettier-ignore
            const channelId = ChannelId.fromOutPoint(outpoint);
            expect(channelId.toString()).to.equal("0000000000000000000000000000000000000000000000000000000000000000"); // prettier-ignore
        });

        it("00000000000000000000000000000000000000000000000000000000000000ff:0", () => {
            const outpoint = OutPoint.fromString("00000000000000000000000000000000000000000000000000000000000000ff:0"); // prettier-ignore
            const channelId = ChannelId.fromOutPoint(outpoint);
            expect(channelId.toString()).to.equal("00000000000000000000000000000000000000000000000000000000000000ff"); // prettier-ignore
        });

        it("00000000000000000000000000000000000000000000000000000000000000ff:255", () => {
            const outpoint = OutPoint.fromString("00000000000000000000000000000000000000000000000000000000000000ff:255"); // prettier-ignore
            const channelId = ChannelId.fromOutPoint(outpoint);
            expect(channelId.toString()).to.equal("0000000000000000000000000000000000000000000000000000000000000000"); // prettier-ignore
        });

        it("000000000000000000000000000000000000000000000000000000000000ffff:255", () => {
            const outpoint = OutPoint.fromString("000000000000000000000000000000000000000000000000000000000000ffff:255"); // prettier-ignore
            const channelId = ChannelId.fromOutPoint(outpoint);
            expect(channelId.toString()).to.equal("000000000000000000000000000000000000000000000000000000000000ff00"); // prettier-ignore
        });

        it("000000000000000000000000000000000000000000000000000000000000ffff:256", () => {
            const outpoint = OutPoint.fromString("000000000000000000000000000000000000000000000000000000000000ffff:256"); // prettier-ignore
            const channelId = ChannelId.fromOutPoint(outpoint);
            expect(channelId.toString()).to.equal("000000000000000000000000000000000000000000000000000000000000feff"); // prettier-ignore
        });

        it("000000000000000000000000000000000000000000000000000000000000ffff:256", () => {
            const outpoint = OutPoint.fromString("000000000000000000000000000000000000000000000000000000000000ffff:256"); // prettier-ignore
            const channelId = ChannelId.fromOutPoint(outpoint);
            expect(channelId.toString()).to.equal("000000000000000000000000000000000000000000000000000000000000feff"); // prettier-ignore
        });

        it("000000000000000000000000000000000000000000000000000000000000ffff:65280", () => {
            const outpoint = OutPoint.fromString("000000000000000000000000000000000000000000000000000000000000ffff:65280"); // prettier-ignore
            const channelId = ChannelId.fromOutPoint(outpoint);
            expect(channelId.toString()).to.equal("00000000000000000000000000000000000000000000000000000000000000ff"); // prettier-ignore
        });

        it("0000000000000000000000000000000000000000000000000000000000000000:65536", () => {
            const outpoint = OutPoint.fromString("000000000000000000000000000000000000000000000000000000000000ffff:65536"); // prettier-ignore
            expect(() => ChannelId.fromOutPoint(outpoint)).to.throw();
        });
    });

    describe(".equals()", () => {
        it("true when equal", () => {
            const a = new ChannelId(Buffer.alloc(32, 0));
            const b = new ChannelId(Buffer.alloc(32, 0));
            expect(a.equals(b)).to.equal(true);
        });

        it("false when not equal", () => {
            const a = new ChannelId(Buffer.alloc(32, 0));
            const b = new ChannelId(Buffer.alloc(32, 1));
            expect(a.equals(b)).to.equal(false);
        });
    });

    describe(".toString()", () => {
        it("serializes to hex", () => {
            const sut = new ChannelId(Buffer.alloc(32, 0));
            expect(sut.toString()).to.equal(
                "0000000000000000000000000000000000000000000000000000000000000000",
            );
        });
    });

    describe(".toBuffer()", () => {
        it("should create new buffer", () => {
            const buf = Buffer.alloc(32, 0);
            const sut = new ChannelId(buf);
            expect(sut.toBuffer()).to.deep.equal(buf);
            expect(sut.toBuffer()).to.not.equal(buf);
        });
    });
});
