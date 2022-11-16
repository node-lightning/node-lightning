import { expect } from "chai";
import { generateFiller } from "../../lib/onion/generateFiller";
import { KeyType } from "../../lib/onion/KeyType";

describe("generateFiller", () => {
    it("1 hop", () => {
        const type = KeyType.rho;
        const numHops = 1;
        const hopSize = 65;
        const sharedSecrets = [
            Buffer.from("53eb63ea8a3fec3b3cd433b85cd62a4b145e1dda09391b348c4e1cd36a03ea66", "hex"),
            Buffer.from("a6519e98832a0b179f62123b3567c106db99ee37bef036e783263602f3488fae", "hex"),
            Buffer.from("3a6b412548762f0dbccce5c7ae7bb8147d1caf9b5471c34120b30bc9c04891cc", "hex"),
            Buffer.from("21e13c2d7cfe7e18836df50872466117a295783ab8aab0e7ecc8c725503ad02d", "hex"),
            Buffer.from("b5756b9b542727dbafc6765a49488b023a725d631af688fc031217e90770c328", "hex"),
        ];
        const filler = generateFiller(type, numHops, hopSize, sharedSecrets);
        expect(filler.toString("hex")).to.equal("");
    });

    it("2 hop", () => {
        const type = KeyType.rho;
        const numHops = 2;
        const hopSize = 65;
        const sharedSecrets = [
            Buffer.from("53eb63ea8a3fec3b3cd433b85cd62a4b145e1dda09391b348c4e1cd36a03ea66", "hex"),
            Buffer.from("a6519e98832a0b179f62123b3567c106db99ee37bef036e783263602f3488fae", "hex"),
            Buffer.from("3a6b412548762f0dbccce5c7ae7bb8147d1caf9b5471c34120b30bc9c04891cc", "hex"),
            Buffer.from("21e13c2d7cfe7e18836df50872466117a295783ab8aab0e7ecc8c725503ad02d", "hex"),
            Buffer.from("b5756b9b542727dbafc6765a49488b023a725d631af688fc031217e90770c328", "hex"),
        ];
        const filler = generateFiller(type, numHops, hopSize, sharedSecrets);
        expect(filler.toString("hex")).to.equal(
            "989115ade30d309374fea8435815418038534d12e4ffe88b91406a71d89d5a083e3b8224d86b2be11be32169afb04b9ea997854be9085472c342ef5fca19bf5479",
        );
    });

    it("3 hop", () => {
        const type = KeyType.rho;
        const numHops = 3;
        const hopSize = 65;
        const sharedSecrets = [
            Buffer.from("53eb63ea8a3fec3b3cd433b85cd62a4b145e1dda09391b348c4e1cd36a03ea66", "hex"),
            Buffer.from("a6519e98832a0b179f62123b3567c106db99ee37bef036e783263602f3488fae", "hex"),
            Buffer.from("3a6b412548762f0dbccce5c7ae7bb8147d1caf9b5471c34120b30bc9c04891cc", "hex"),
            Buffer.from("21e13c2d7cfe7e18836df50872466117a295783ab8aab0e7ecc8c725503ad02d", "hex"),
            Buffer.from("b5756b9b542727dbafc6765a49488b023a725d631af688fc031217e90770c328", "hex"),
        ];
        const filler = generateFiller(type, numHops, hopSize, sharedSecrets);
        expect(filler.toString("hex")).to.equal(
            "0477a2f94b891573929c4b51deafe6db81bc30680f7226a68567588f195ce96a791e28204b9b5844c28a61736ac20722fe156175210c7b9b6e1804c89c0a7ee136597b5b3de5d54be23671bc9477805ba10d03afb0715782845d2ab45df012f6644207cc5fa4739aa3eaf6bf84e790128aa08aede33bf30c6be2b264b33fac566209",
        );
    });

    it("4 hop", () => {
        const type = KeyType.rho;
        const numHops = 4;
        const hopSize = 65;
        const sharedSecrets = [
            Buffer.from("53eb63ea8a3fec3b3cd433b85cd62a4b145e1dda09391b348c4e1cd36a03ea66", "hex"),
            Buffer.from("a6519e98832a0b179f62123b3567c106db99ee37bef036e783263602f3488fae", "hex"),
            Buffer.from("3a6b412548762f0dbccce5c7ae7bb8147d1caf9b5471c34120b30bc9c04891cc", "hex"),
            Buffer.from("21e13c2d7cfe7e18836df50872466117a295783ab8aab0e7ecc8c725503ad02d", "hex"),
            Buffer.from("b5756b9b542727dbafc6765a49488b023a725d631af688fc031217e90770c328", "hex"),
        ];
        const filler = generateFiller(type, numHops, hopSize, sharedSecrets);
        expect(filler.toString("hex")).to.equal(
            "c5d6d4c488fcf55af99aef02f3bdf6a07833660628a672b878f8b15427189e49bf2d9e0e7e63e3c5632d9ef1e412e9bbd732b616a353097e90494a098df6a21729f1d3658f91b1bde4aaaae58530ab0e402fc10eb0910c07cace1afd0aacb579690e6dcbc184025e4160cf4de3e47106339046724d098b5b7b92f5a2bb33c11f86d4953f372fdd9ebc260b0ee2e391420c4b11145bd439954834d9a79e78abc57e03d3ee20d239d8a13014976e3f057ab3c38ca79ee81ff8849d94dca37b0920cc3e72",
        );
    });

    it("5 hop", () => {
        const type = KeyType.rho;
        const numHops = 5;
        const hopSize = 65;
        const sharedSecrets = [
            Buffer.from("53eb63ea8a3fec3b3cd433b85cd62a4b145e1dda09391b348c4e1cd36a03ea66", "hex"),
            Buffer.from("a6519e98832a0b179f62123b3567c106db99ee37bef036e783263602f3488fae", "hex"),
            Buffer.from("3a6b412548762f0dbccce5c7ae7bb8147d1caf9b5471c34120b30bc9c04891cc", "hex"),
            Buffer.from("21e13c2d7cfe7e18836df50872466117a295783ab8aab0e7ecc8c725503ad02d", "hex"),
            Buffer.from("b5756b9b542727dbafc6765a49488b023a725d631af688fc031217e90770c328", "hex"),
        ];
        const filler = generateFiller(type, numHops, hopSize, sharedSecrets);
        expect(filler.toString("hex")).to.equal(
            "c6b008cf6414ed6e4c42c291eb505e9f22f5fe7d0ecdd15a833f4d016ac974d33adc6ea3293e20859e87ebfb937ba406abd025d14af692b12e9c9c2adbe307a679779259676211c071e614fdb386d1ff02db223a5b2fae03df68d321c7b29f7c7240edd3fa1b7cb6903f89dc01abf41b2eb0b49b6b8d73bb0774b58204c0d0e96d3cce45ad75406be0bc009e327b3e712a4bd178609c00b41da2daf8a4b0e1319f07a492ab4efb056f0f599f75e6dc7e0d10ce1cf59088ab6e873de377343880f7a24f0e36731a0b72092f8d5bc8cd346762e93b2bf203d00264e4bc136fc142de8f7b69154deb05854ea88e2d7506222c95ba1aab065c8a851391377d3406a35a9af3ac",
        );
    });
});
