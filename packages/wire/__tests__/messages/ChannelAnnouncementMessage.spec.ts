// tslint:disable: no-unused-expression
import { BitField } from "@node-lightning/core";
import { expect } from "chai";
import { ChannelAnnouncementMessage } from "../../lib/messages/ChannelAnnouncementMessage";
import { ShortChannelId } from "../../lib/ShortChannelId";

describe("ChannelAnnouncementMessage", () => {
    describe(".deserialize", () => {
        const input = Buffer.from(
            "010027927395fe531904ecae995006cbbfe1338482c23008bc46a357a4f629cc47dd0f85651fbe47f779dcfab1cd4908de6a66843b364d6dfc848eb3e5459d00eab5b9674df33652a36bdac711098fdd2adb97d0bfd6f134ac1f9caa420919bfb55d17c3c606d468da05ff0054b40e41e7f4be93f793101b625f68d7124ccd70bc7315df61709a912458e6a378420b1a44ef914062f9a14c84b61226898d6e81a4be31a27e7b19237001c189e523bebd51af289520ff935b98db5426d5b22b1ac56fb063dd7a82583211185fea8bd7a47f1dec88fbda2377f76dfc253cc85e7c33231023d6647f1379e84ff36b4286edd1a2a71f817964bb16f0fd19254ce6441d5a000043497fd7f826957108f4a30fd9cec3aeba79972084e90ead01ea33090000000013a9160000040000036b96e4713c5f84dcb8030592e1bd42a2d9a43d91fa2e535b9bfd05f2c5def9b903c3feb1e9b84d7aa83ea93f1bc58bfe34fa17603d955eb723a9d236336d97f9e9028154cc6b7fb5e58e0bf989de51b8d946183918c5aa08f361825a2b9e767783b803338034d89e56588f7117653074c4ee1920082d53b20710b2578e0d3f08dcfc33",
            "hex",
        );

        let result: ChannelAnnouncementMessage;

        before(() => {
            result = ChannelAnnouncementMessage.deserialize(input);
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
    });

    describe(".serialize", () => {
        it("should serialize instance", () => {
            const instance = new ChannelAnnouncementMessage();
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
            const result = instance.serialize();
            expect(result.toString("hex")).to.equal(
                "010027927395fe531904ecae995006cbbfe1338482c23008bc46a357a4f629cc47dd0f85651fbe47f779dcfab1cd4908de6a66843b364d6dfc848eb3e5459d00eab5b9674df33652a36bdac711098fdd2adb97d0bfd6f134ac1f9caa420919bfb55d17c3c606d468da05ff0054b40e41e7f4be93f793101b625f68d7124ccd70bc7315df61709a912458e6a378420b1a44ef914062f9a14c84b61226898d6e81a4be31a27e7b19237001c189e523bebd51af289520ff935b98db5426d5b22b1ac56fb063dd7a82583211185fea8bd7a47f1dec88fbda2377f76dfc253cc85e7c33231023d6647f1379e84ff36b4286edd1a2a71f817964bb16f0fd19254ce6441d5a000043497fd7f826957108f4a30fd9cec3aeba79972084e90ead01ea33090000000013a9160000040000036b96e4713c5f84dcb8030592e1bd42a2d9a43d91fa2e535b9bfd05f2c5def9b903c3feb1e9b84d7aa83ea93f1bc58bfe34fa17603d955eb723a9d236336d97f9e9028154cc6b7fb5e58e0bf989de51b8d946183918c5aa08f361825a2b9e767783b803338034d89e56588f7117653074c4ee1920082d53b20710b2578e0d3f08dcfc33",
            );
        });

        it("should serialize features", () => {
            const instance = new ChannelAnnouncementMessage();
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
            instance.features = BitField.fromNumber(1);
            instance.chainHash = Buffer.from(
                "43497fd7f826957108f4a30fd9cec3aeba79972084e90ead01ea330900000000",
                "hex",
            );
            instance.shortChannelId = new ShortChannelId(1288470, 4, 0);
            const result = instance.serialize();
            expect(result.toString("hex")).to.equal(
                "010027927395fe531904ecae995006cbbfe1338482c23008bc46a357a4f629cc47dd0f85651fbe47f779dcfab1cd4908de6a66843b364d6dfc848eb3e5459d00eab5b9674df33652a36bdac711098fdd2adb97d0bfd6f134ac1f9caa420919bfb55d17c3c606d468da05ff0054b40e41e7f4be93f793101b625f68d7124ccd70bc7315df61709a912458e6a378420b1a44ef914062f9a14c84b61226898d6e81a4be31a27e7b19237001c189e523bebd51af289520ff935b98db5426d5b22b1ac56fb063dd7a82583211185fea8bd7a47f1dec88fbda2377f76dfc253cc85e7c33231023d6647f1379e84ff36b4286edd1a2a71f817964bb16f0fd19254ce6441d5a00010143497fd7f826957108f4a30fd9cec3aeba79972084e90ead01ea33090000000013a9160000040000036b96e4713c5f84dcb8030592e1bd42a2d9a43d91fa2e535b9bfd05f2c5def9b903c3feb1e9b84d7aa83ea93f1bc58bfe34fa17603d955eb723a9d236336d97f9e9028154cc6b7fb5e58e0bf989de51b8d946183918c5aa08f361825a2b9e767783b803338034d89e56588f7117653074c4ee1920082d53b20710b2578e0d3f08dcfc33",
            );
        });
    });

    describe(".verifySignatures", () => {
        it("should verify valid sigs", () => {
            const instance = ChannelAnnouncementMessage.deserialize(
                Buffer.from(
                    "0100ce1d69dbb62e86ad28157f4c24705e325f069d5158b91b28bdf55e508afcc1b554a498f4bda8a3d34a206ddb617ad0e945ecadc9a61086bac5afae3e19976242d464e8d305772f29021a4d07617c4159e7e0634bd53991c0e0577c0e9c3d3ee61d7311e6773275335c12f17e573e2813391a71050ab58c03c17d06c0d841db2ec6c6514c2156713651dfbee13d491559764c95343386218ab904173742dde6ca3118d303967e073a44e94f16eef4d878d4d74f1ff1f6924109421cf9c41e8e5c961cf1c7e2316e61a952c7caad056fea1d13d2f4bf855bd3f06d019a33814bc70ea99fa79f026c791b87040e781e8493f5165dafbfc23fabe2912c3ed0ab7e0f000043497fd7f826957108f4a30fd9cec3aeba79972084e90ead01ea33090000000013a9090000030000036b96e4713c5f84dcb8030592e1bd42a2d9a43d91fa2e535b9bfd05f2c5def9b9039cc950286a8fa99218283d1adc2456e0d5e81be558da77dd6e85ba9a1fff5ad303ca63b9acbadf5b644c11d0a9dd65b82b14e0d26fc5e0bcf071a90879f603d46203a0ee0a716f4a436864fe53bb788a003321aee63150bf63fd5529e4e1da93481d",
                    "hex",
                ),
            );
            const result = ChannelAnnouncementMessage.verifySignatures(instance);
            expect(result).to.be.true;
        });
    });
});
