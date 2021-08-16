// tslint:disable: no-unused-expression
import { BitField, ShortChannelId, Value } from "@node-lightning/core";
import { expect } from "chai";
import { ChannelUpdateMessage } from "../../lib/messages/ChannelUpdateMessage";

describe("ChannelUpdateMessage", () => {
    let input: Buffer;

    beforeEach(() => {
        input = Buffer.from(
            "010260957fec5b79b49303c1abe01b188842512c91ff465bdde51e255416e63bb293124a8dfea82644ee554ef8bd13d6ffbd20b6e297a1eae3c46ba1b188fd1d86c543497fd7f826957108f4a30fd9cec3aeba79972084e90ead01ea33090000000013a8b300011300005ca907fa0100009000000000000003e8000003e8000000010000000005f5e100",
            "hex",
        );
    });

    describe(".deserialize", () => {
        it("should deserialize without error", () => {
            const result = ChannelUpdateMessage.deserialize(input);
            expect(result.type).to.equal(258);
            expect(result.chainHash).to.deep.equal(
                Buffer.from(
                    "43497fd7f826957108f4a30fd9cec3aeba79972084e90ead01ea330900000000",
                    "hex",
                ),
            );
            expect(result.shortChannelId).to.deep.equal(new ShortChannelId(1288371, 275, 0));
            expect(result.timestamp).to.equal(1554581498);
            expect(result.messageFlags.value).to.equal(BigInt(1));
            expect(result.channelFlags.value).to.equal(BigInt(0));
            expect(result.cltvExpiryDelta).to.equal(144);
            expect(Number(result.htlcMinimumMsat.msats)).to.equal(1000);
            expect(Number(result.htlcMaximumMsat.msats)).to.equal(100000000);
            expect(Number(result.feeBaseMsat.msats)).to.equal(1000);
            expect(Number(result.feeProportionalMillionths.microsats)).to.equal(1);
            expect(result.direction).to.equal(0);
            expect(result.disabled).to.be.false;
        });
    });

    describe(".serialize", () => {
        it("should serialize a message", () => {
            const instance = new ChannelUpdateMessage();
            instance.signature = Buffer.from("60957fec5b79b49303c1abe01b188842512c91ff465bdde51e255416e63bb293124a8dfea82644ee554ef8bd13d6ffbd20b6e297a1eae3c46ba1b188fd1d86c5", "hex"); // prettier-ignore
            instance.chainHash = Buffer.from("43497fd7f826957108f4a30fd9cec3aeba79972084e90ead01ea330900000000", "hex"); // prettier-ignore
            instance.shortChannelId = new ShortChannelId(1288371, 275, 0);
            instance.timestamp = 1554581498;
            instance.messageFlags = new BitField(BigInt(1));
            instance.channelFlags = new BitField(BigInt(0));
            instance.cltvExpiryDelta = 144;
            instance.htlcMinimumMsat = Value.fromMilliSats(1000);
            instance.htlcMaximumMsat = Value.fromMilliSats(100000000);
            instance.feeBaseMsat = Value.fromMilliSats(1000);
            instance.feeProportionalMillionths = Value.fromMicroSats(1);

            const result = instance.serialize();
            expect(result.toString("hex")).to.deep.equal(
                "010260957fec5b79b49303c1abe01b188842512c91ff465bdde51e255416e63bb293124a8dfea82644ee554ef8bd13d6ffbd20b6e297a1eae3c46ba1b188fd1d86c543497fd7f826957108f4a30fd9cec3aeba79972084e90ead01ea33090000000013a8b300011300005ca907fa0100009000000000000003e8000003e8000000010000000005f5e100",
            );
        });
    });

    describe(".validateSignature", () => {
        let input: Buffer;
        let nodeId: Buffer;
        beforeEach(() => {
            input = Buffer.from(
                "01024e6eac97124742ba6a033612c8009945c0d52568756a885692b4adbf202666503b56ecb6f5758ea450dda940b2a6853b8e1706c3bd4f38a347be91b08c5e5c4743497fd7f826957108f4a30fd9cec3aeba79972084e90ead01ea33090000000013a90900000300005cdd9d780002009000000000000003e8000003e800000001",
                "hex",
            );
            nodeId = Buffer.from(
                "036b96e4713c5f84dcb8030592e1bd42a2d9a43d91fa2e535b9bfd05f2c5def9b9",
                "hex",
            );
        });

        it("should return true on valid signature", () => {
            const instance = ChannelUpdateMessage.deserialize(input);
            const result = ChannelUpdateMessage.validateSignature(instance, nodeId);
            expect(result).to.be.true;
        });
    });
});
