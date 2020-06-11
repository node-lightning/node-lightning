// tslint:disable: no-unused-expression
import { expect } from "chai";
import { BitField } from "../../lib/BitField";
import { OutPoint } from "../../lib/domain/OutPoint";
import { ExtendedChannelAnnouncementMessage } from "../../lib/messages/ExtendedChannelAnnouncementMessage";
import { ShortChannelId } from "../../lib/ShortChannelId";

describe("ExtendedChannelAnnouncementMessage", () => {
    describe(".deserialize", () => {
        const input = Buffer.from(
            "010027927395fe531904ecae995006cbbfe1338482c23008bc46a357a4f629cc47dd0f85651fbe47f779dcfab1cd4908de6a66843b364d6dfc848eb3e5459d00eab5b9674df33652a36bdac711098fdd2adb97d0bfd6f134ac1f9caa420919bfb55d17c3c606d468da05ff0054b40e41e7f4be93f793101b625f68d7124ccd70bc7315df61709a912458e6a378420b1a44ef914062f9a14c84b61226898d6e81a4be31a27e7b19237001c189e523bebd51af289520ff935b98db5426d5b22b1ac56fb063dd7a82583211185fea8bd7a47f1dec88fbda2377f76dfc253cc85e7c33231023d6647f1379e84ff36b4286edd1a2a71f817964bb16f0fd19254ce6441d5a000043497fd7f826957108f4a30fd9cec3aeba79972084e90ead01ea33090000000013a9160000040000036b96e4713c5f84dcb8030592e1bd42a2d9a43d91fa2e535b9bfd05f2c5def9b903c3feb1e9b84d7aa83ea93f1bc58bfe34fa17603d955eb723a9d236336d97f9e9028154cc6b7fb5e58e0bf989de51b8d946183918c5aa08f361825a2b9e767783b803338034d89e56588f7117653074c4ee1920082d53b20710b2578e0d3f08dcfc33fe010000372019ae00cc05676137495595172ff82382e0c7f8b7bd512a26e6c4b6af4093ed9ffe0100003903ffff65",
            "hex",
        );

        let result: ExtendedChannelAnnouncementMessage;

        before(() => {
            result = ExtendedChannelAnnouncementMessage.deserialize(input);
        });

        it("should have type 256", () => {
            expect(result.type).to.equal(256);
        });

        it("should have 64 byte node sig 1", () => {
            expect(result.nodeSignature1.toString("hex")).to.equal(
                "27927395fe531904ecae995006cbbfe1338482c23008bc46a357a4f629cc47dd0f85651fbe47f779dcfab1cd4908de6a66843b364d6dfc848eb3e5459d00eab5",
            );
        });

        it("should have 64 byte node sig 2", () => {
            expect(result.nodeSignature2.toString("hex")).to.equal(
                "b9674df33652a36bdac711098fdd2adb97d0bfd6f134ac1f9caa420919bfb55d17c3c606d468da05ff0054b40e41e7f4be93f793101b625f68d7124ccd70bc73",
            );
        });

        it("should have 64 byte bitcoin sig 1", () => {
            expect(result.bitcoinSignature1.toString("hex")).to.equal(
                "15df61709a912458e6a378420b1a44ef914062f9a14c84b61226898d6e81a4be31a27e7b19237001c189e523bebd51af289520ff935b98db5426d5b22b1ac56f",
            );
        });

        it("should have 64 byte bitcoin sig 2", () => {
            expect(result.bitcoinSignature2.toString("hex")).to.equal(
                "b063dd7a82583211185fea8bd7a47f1dec88fbda2377f76dfc253cc85e7c33231023d6647f1379e84ff36b4286edd1a2a71f817964bb16f0fd19254ce6441d5a",
            );
        });

        it("should have features", () => {
            expect(result.features.toNumber()).to.equal(0);
        });

        it("should have chain hash", () => {
            expect(result.chainHash.toString("hex")).to.equal(
                "43497fd7f826957108f4a30fd9cec3aeba79972084e90ead01ea330900000000",
            );
        });

        it("should have short channel id", () => {
            expect(result.shortChannelId).to.deep.equal(new ShortChannelId(1288470, 4, 0));
        });

        it("should have node id 1", () => {
            expect(result.nodeId1.toString("hex")).to.equal(
                "036b96e4713c5f84dcb8030592e1bd42a2d9a43d91fa2e535b9bfd05f2c5def9b9",
            );
        });

        it("should have node id 2", () => {
            expect(result.nodeId2.toString("hex")).to.equal(
                "03c3feb1e9b84d7aa83ea93f1bc58bfe34fa17603d955eb723a9d236336d97f9e9",
            );
        });

        it("should have bitcoin key 1", () => {
            expect(result.bitcoinKey1.toString("hex")).to.equal(
                "028154cc6b7fb5e58e0bf989de51b8d946183918c5aa08f361825a2b9e767783b8",
            );
        });

        it("should have bitcoin key 2", () => {
            expect(result.bitcoinKey2.toString("hex")).to.equal(
                "03338034d89e56588f7117653074c4ee1920082d53b20710b2578e0d3f08dcfc33",
            );
        });

        it("should have outpoint", () => {
            expect(result.outpoint).to.deep.equal(
                new OutPoint("19ae00cc05676137495595172ff82382e0c7f8b7bd512a26e6c4b6af4093ed9f", 0),
            );
        });

        it("should have capacity", () => {
            expect(result.capacity).to.equal(BigInt("16777061"));
        });
    });

    describe(".serialize", () => {
        it("should serialize instance", () => {
            const instance = new ExtendedChannelAnnouncementMessage();
            instance.nodeId1 = Buffer.from(
                "036b96e4713c5f84dcb8030592e1bd42a2d9a43d91fa2e535b9bfd05f2c5def9b9",
                "hex",
            );
            instance.nodeSignature1 = Buffer.from(
                "27927395fe531904ecae995006cbbfe1338482c23008bc46a357a4f629cc47dd0f85651fbe47f779dcfab1cd4908de6a66843b364d6dfc848eb3e5459d00eab5",
                "hex",
            );
            instance.nodeId2 = Buffer.from(
                "03c3feb1e9b84d7aa83ea93f1bc58bfe34fa17603d955eb723a9d236336d97f9e9",
                "hex",
            );
            instance.nodeSignature2 = Buffer.from(
                "b9674df33652a36bdac711098fdd2adb97d0bfd6f134ac1f9caa420919bfb55d17c3c606d468da05ff0054b40e41e7f4be93f793101b625f68d7124ccd70bc73",
                "hex",
            );
            instance.bitcoinKey1 = Buffer.from(
                "028154cc6b7fb5e58e0bf989de51b8d946183918c5aa08f361825a2b9e767783b8",
                "hex",
            );
            instance.bitcoinSignature1 = Buffer.from(
                "15df61709a912458e6a378420b1a44ef914062f9a14c84b61226898d6e81a4be31a27e7b19237001c189e523bebd51af289520ff935b98db5426d5b22b1ac56f",
                "hex",
            );
            instance.bitcoinKey2 = Buffer.from(
                "03338034d89e56588f7117653074c4ee1920082d53b20710b2578e0d3f08dcfc33",
                "hex",
            );
            instance.bitcoinSignature2 = Buffer.from(
                "b063dd7a82583211185fea8bd7a47f1dec88fbda2377f76dfc253cc85e7c33231023d6647f1379e84ff36b4286edd1a2a71f817964bb16f0fd19254ce6441d5a",
                "hex",
            );
            instance.features = new BitField();
            instance.chainHash = Buffer.from(
                "43497fd7f826957108f4a30fd9cec3aeba79972084e90ead01ea330900000000",
                "hex",
            );
            instance.shortChannelId = new ShortChannelId(1288470, 4, 0);

            instance.outpoint = new OutPoint(
                "19ae00cc05676137495595172ff82382e0c7f8b7bd512a26e6c4b6af4093ed9f",
                0,
            );

            instance.capacity = BigInt(16777061);

            const result = instance.serialize();
            expect(result.toString("hex")).to.equal(
                "010027927395fe531904ecae995006cbbfe1338482c23008bc46a357a4f629cc47dd0f85651fbe47f779dcfab1cd4908de6a66843b364d6dfc848eb3e5459d00eab5b9674df33652a36bdac711098fdd2adb97d0bfd6f134ac1f9caa420919bfb55d17c3c606d468da05ff0054b40e41e7f4be93f793101b625f68d7124ccd70bc7315df61709a912458e6a378420b1a44ef914062f9a14c84b61226898d6e81a4be31a27e7b19237001c189e523bebd51af289520ff935b98db5426d5b22b1ac56fb063dd7a82583211185fea8bd7a47f1dec88fbda2377f76dfc253cc85e7c33231023d6647f1379e84ff36b4286edd1a2a71f817964bb16f0fd19254ce6441d5a000043497fd7f826957108f4a30fd9cec3aeba79972084e90ead01ea33090000000013a9160000040000036b96e4713c5f84dcb8030592e1bd42a2d9a43d91fa2e535b9bfd05f2c5def9b903c3feb1e9b84d7aa83ea93f1bc58bfe34fa17603d955eb723a9d236336d97f9e9028154cc6b7fb5e58e0bf989de51b8d946183918c5aa08f361825a2b9e767783b803338034d89e56588f7117653074c4ee1920082d53b20710b2578e0d3f08dcfc33fe010000372019ae00cc05676137495595172ff82382e0c7f8b7bd512a26e6c4b6af4093ed9ffe0100003903ffff65",
            );
        });
    });
});
