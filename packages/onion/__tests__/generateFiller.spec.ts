import { expect } from "chai";
import { generateFiller } from "../lib/generateFiller";
import { KeyType } from "../lib/KeyType";

describe("generateFiller", () => {
    it("1 hop", () => {
        const type = KeyType.pad;
        const numHops = 1;
        const hopSize = 64;
        const sharedSecrets = [
            Buffer.from("53eb63ea8a3fec3b3cd433b85cd62a4b145e1dda09391b348c4e1cd36a03ea66", "hex"),
            Buffer.from("a6519e98832a0b179f62123b3567c106db99ee37bef036e783263602f3488fae", "hex"),
            Buffer.from("3a6b412548762f0dbccce5c7ae7bb8147d1caf9b5471c34120b30bc9c04891cc", "hex"),
            Buffer.from("21e13c2d7cfe7e18836df50872466117a295783ab8aab0e7ecc8c725503ad02d", "hex"),
        ];
        const filler = generateFiller(type, numHops, hopSize, sharedSecrets);
        expect(filler.toString("hex")).to.equal("");
    });

    it("2 hop", () => {
        const type = KeyType.pad;
        const numHops = 2;
        const hopSize = 64;
        const sharedSecrets = [
            Buffer.from("53eb63ea8a3fec3b3cd433b85cd62a4b145e1dda09391b348c4e1cd36a03ea66", "hex"),
            Buffer.from("a6519e98832a0b179f62123b3567c106db99ee37bef036e783263602f3488fae", "hex"),
            Buffer.from("3a6b412548762f0dbccce5c7ae7bb8147d1caf9b5471c34120b30bc9c04891cc", "hex"),
            Buffer.from("21e13c2d7cfe7e18836df50872466117a295783ab8aab0e7ecc8c725503ad02d", "hex"),
            Buffer.from("b5756b9b542727dbafc6765a49488b023a725d631af688fc031217e90770c328", "hex"),
        ];
        const filler = generateFiller(type, numHops, hopSize, sharedSecrets);
        expect(filler.toString("hex")).to.equal("00".repeat(64));
    });

    it("3 hop", () => {
        const type = KeyType.pad;
        const numHops = 3;
        const hopSize = 64;
        const sharedSecrets = [
            Buffer.from("53eb63ea8a3fec3b3cd433b85cd62a4b145e1dda09391b348c4e1cd36a03ea66", "hex"),
            Buffer.from("a6519e98832a0b179f62123b3567c106db99ee37bef036e783263602f3488fae", "hex"),
            Buffer.from("3a6b412548762f0dbccce5c7ae7bb8147d1caf9b5471c34120b30bc9c04891cc", "hex"),
            Buffer.from("21e13c2d7cfe7e18836df50872466117a295783ab8aab0e7ecc8c725503ad02d", "hex"),
        ];
        const filler = generateFiller(type, numHops, hopSize, sharedSecrets);
        expect(filler.toString("hex")).to.equal(
            "f1c4963de375abdffc0c9a0b6ab5ae3c742da38bdcd2ed08acb04fe11a5eea99be5bab55c23559853a64f92541985abfbedc9b79b7de8b1f677326677ff11e6f00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
        );
    });

    it("4 hop", () => {
        const type = KeyType.pad;
        const numHops = 4;
        const hopSize = 64;
        const sharedSecrets = [
            Buffer.from("53eb63ea8a3fec3b3cd433b85cd62a4b145e1dda09391b348c4e1cd36a03ea66", "hex"),
            Buffer.from("a6519e98832a0b179f62123b3567c106db99ee37bef036e783263602f3488fae", "hex"),
            Buffer.from("3a6b412548762f0dbccce5c7ae7bb8147d1caf9b5471c34120b30bc9c04891cc", "hex"),
            Buffer.from("21e13c2d7cfe7e18836df50872466117a295783ab8aab0e7ecc8c725503ad02d", "hex"),
        ];
        const filler = generateFiller(type, numHops, hopSize, sharedSecrets);
        expect(filler.toString("hex")).to.equal(
            "802d36e3c50f543c5f3a6a23a2a192379823064dcc9f16bfeb3755a74d572881a8bc61d1e4a3e416984a2b2083954c53182b912263c5fbf15039b11de9b0774b02cb9d76b9b635ef2e6c9c7d2993ac771782e500d4c19a5d0b035f4a502fba01ef84455a235f1a155ca38a7e641a208ca63be382b252c7016de0a37d1d898a2100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
        );
    });

    it("5 hop", () => {
        const type = KeyType.pad;
        const numHops = 5;
        const hopSize = 64;
        const sharedSecrets = [
            Buffer.from("53eb63ea8a3fec3b3cd433b85cd62a4b145e1dda09391b348c4e1cd36a03ea66", "hex"),
            Buffer.from("a6519e98832a0b179f62123b3567c106db99ee37bef036e783263602f3488fae", "hex"),
            Buffer.from("3a6b412548762f0dbccce5c7ae7bb8147d1caf9b5471c34120b30bc9c04891cc", "hex"),
            Buffer.from("21e13c2d7cfe7e18836df50872466117a295783ab8aab0e7ecc8c725503ad02d", "hex"),
        ];
        const filler = generateFiller(type, numHops, hopSize, sharedSecrets);
        expect(filler.toString("hex")).to.equal(
            "7ebd5087e51f95b8d91403e298f2f39f20793ee0920952ea028da58b4bdece61639489f157cf276dda7dea7f9a2f8cc300848c28be2cec53f3463332a2e3681248edde1edd276956a0cce0d7e24c294d1dc9ac759f8a39a8592875d65168ab649cf45af270439f567392e9e0dcd6724e517422f9e225ddc2a666c155f95cbd7d105bca121c201d064b93c5faabd174e7a67315279fed6dd8d5e3a425748cc795ae33b1df72e7479ff6c6069f6efe7eba72ee31fc84219031575494caf16fdeb500000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
        );
    });
});
