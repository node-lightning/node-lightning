const { expect } = require("chai");
const { ChannelKeys } = require("../../lib/lightning/ChannelKeys");

describe("ChannelKeys", () => {
    describe("BOLT3 Test Vectors", () => {
        const baseSecret = Buffer.from(
            "000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f",
            "hex",
        );
        const perCommitmentSecret = Buffer.from(
            "1f1e1d1c1b1a191817161514131211100f0e0d0c0b0a09080706050403020100",
            "hex",
        );
        const basePoint = Buffer.from(
            "036d6caac248af96f6afa7f904f550253a0f3ef3f5aa2fe6838a95b216691468e2",
            "hex",
        );
        const perCommitmentPoint = Buffer.from(
            "025f7117a78150fe2ef97db7cfc83bd57b2e2c0d0dd25eaf467a4a1c2a45ce1486",
            "hex",
        );

        describe("#derivePubKey()", () => {
            it("should create a valid public key", () => {
                let result = ChannelKeys.derivePubKey(perCommitmentPoint, basePoint);
                expect(result).to.deep.equal(
                    Buffer.from(
                        "0235f2dbfaa89b57ec7b055afe29849ef7ddfeb1cefdb9ebdc43f5494984db29e5",
                        "hex",
                    ),
                );
            });
        });

        describe("#derivePrivKey()", () => {
            it("should create a valid private key", () => {
                let result = ChannelKeys.derivePrivKey(perCommitmentPoint, baseSecret);
                expect(result).to.deep.equal(
                    Buffer.from(
                        "cbced912d3b21bf196a766651e436aff192362621ce317704ea2f75d87e7be0f",
                        "hex",
                    ),
                );
            });
        });

        describe("#deriveRevocationPubKey()", () => {
            it("should create a valid revocation public key", () => {
                let result = ChannelKeys.deriveRevocationPubKey(perCommitmentPoint, basePoint);
                expect(result).to.deep.equal(
                    Buffer.from(
                        "02916e326636d19c33f13e8c0c3a03dd157f332f3e99c317c141dd865eb01f8ff0",
                        "hex",
                    ),
                );
            });
        });

        describe("#deriveRevocationPrivKey()", () => {
            it("should create a valid revocation private key", () => {
                let result = ChannelKeys.deriveRevocationPrivKey(perCommitmentSecret, baseSecret);
                expect(result).to.deep.equal(
                    Buffer.from(
                        "d09ffff62ddb2297ab000cc85bcb4283fdeb6aa052affbc9dddcf33b61078110",
                        "hex",
                    ),
                );
            });
        });
    });
});
