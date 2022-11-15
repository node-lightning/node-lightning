import { expect } from "chai";
import { SharedSecretGenerator } from "../../lib/onion/SharedSecretGenerator";

describe("SessionKeyChain", () => {
    it("should generate shared secrets", () => {
        const sessionKey = Buffer.from("4141414141414141414141414141414141414141414141414141414141414141", "hex"); // prettier-ignore
        const hops = [
            Buffer.from("02eec7245d6b7d2ccb30380bfbe2a3648cd7a942653f5aa340edcea1f283686619", "hex"),
            Buffer.from("0324653eac434488002cc06bbfb7f10fe18991e35f9fe4302dbea6d2353dc0ab1c", "hex"),
            Buffer.from("027f31ebc5462c1fdce1b737ecff52d37d75dea43ce11c74d25aa297165faa2007", "hex"),
            Buffer.from("032c0b7cf95324a07d05398b240174dc0c2be444d96b159aa6c7f7b1e668680991", "hex"),
            Buffer.from("02edabbd16b41c8371b92ef2f04c1185b4f03b6dcd52ba9b78d9d7c89c8f221145", "hex"),
        ]; // prettier-ignore
        const sut = new SharedSecretGenerator(sessionKey, ...hops);
        expect(sut.sharedSecrets[0].toString("hex")).to.equal("53eb63ea8a3fec3b3cd433b85cd62a4b145e1dda09391b348c4e1cd36a03ea66"); // prettier-ignore
        expect(sut.sharedSecrets[1].toString("hex")).to.equal("a6519e98832a0b179f62123b3567c106db99ee37bef036e783263602f3488fae"); // prettier-ignore
        expect(sut.sharedSecrets[2].toString("hex")).to.equal("3a6b412548762f0dbccce5c7ae7bb8147d1caf9b5471c34120b30bc9c04891cc"); // prettier-ignore
        expect(sut.sharedSecrets[3].toString("hex")).to.equal("21e13c2d7cfe7e18836df50872466117a295783ab8aab0e7ecc8c725503ad02d"); // prettier-ignore
        expect(sut.sharedSecrets[4].toString("hex")).to.equal("b5756b9b542727dbafc6765a49488b023a725d631af688fc031217e90770c328"); // prettier-ignore
    });
});
