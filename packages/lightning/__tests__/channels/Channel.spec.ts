import { expect } from "chai";
import { Channel } from "../../lib/channels/Channel";
import {
    createFakeAcceptChannel,
    createFakeChannel,
    createFakeFundingSignedMessage,
    createFakeFundingTx,
} from "../_test-utils";

describe(Channel.name, () => {
    describe(Channel.prototype.attachAcceptChannel.name, () => {
        it("attaches all properties", () => {
            // arrange
            const channel = createFakeChannel();
            const msg = createFakeAcceptChannel();

            // act
            channel.attachAcceptChannel(msg);

            // assert
            expect(channel.minimumDepth).to.equal(6);
            expect(channel.ourSide.toSelfDelayBlocks).to.equal(144);
            expect(channel.ourSide.channelReserve.sats).to.equal(20_000n);
            expect(channel.theirSide.dustLimit.sats).to.equal(354n);
            expect(channel.theirSide.minHtlcValue.sats).to.equal(200n);
            expect(channel.theirSide.maxInFlightHtlcValue.sats).to.equal(20_000n);
            expect(channel.theirSide.maxAcceptedHtlc).to.equal(30);
            expect(channel.theirSide.fundingPubKey.toHex()).to.equal(
                "03774ae7f858a9411e5ef4246b70c65aac5649980be5c17891bbec17895da008cb",
            );
            expect(channel.theirSide.paymentBasePoint.toHex()).to.equal(
                "03d01115d548e7561b15c38f004d734633687cf4419620095bc5b0f47070afe85a",
            );
            expect(channel.theirSide.delayedBasePoint.toHex()).to.equal(
                "03f28773c2d975288bc7d1d205c3748651b075fbc6610e58cddeeddf8f19405aa8",
            );
            expect(channel.theirSide.htlcBasePoint.toHex()).to.equal(
                "03499fdf9e895e719cfd64e67f07d38e3226aa7b63678949e6e49b241a60e823e4",
            );
            expect(channel.theirSide.revocationBasePoint.toHex()).to.equal(
                "02d7924d4f7d43ea965a465ae3095ff41131e5946f3c85f79e44adbcf8e27e080e",
            );
            expect(channel.theirSide.nextCommitmentNumber.value).to.equal(0n);
            expect(channel.theirSide.nextCommitmentPoint.toHex()).to.equal(
                "0288a618cb6027c3218a37cbe9e882379f17d87d03f6e99d0b60292478d2aded06",
            );
        });
    });

    describe(Channel.prototype.attachFundingTx.name, () => {
        it("attach all properties", () => {
            // arrange
            const channel = createFakeChannel().attachAcceptChannel(createFakeAcceptChannel());
            const fundingTx = createFakeFundingTx();

            // act
            channel.attachFundingTx(fundingTx);

            // assert
            expect(channel.fundingTx).to.equal(fundingTx);
            expect(channel.fundingOutPoint.txid.eq(fundingTx.txId)).to.equal(true);
            expect(channel.fundingOutPoint.outputIndex).to.equal(0);
            expect(channel.channelId.toHex()).to.equal(
                "6e7848c0fb7e9c4d336149a7fbc60d097f269cb0047917747156749b1bd5d5a0",
            );
        });
    });

    describe(Channel.prototype.attachFundingSigned.name, () => {
        it("should attach signature to our side's next signature", () => {
            // arrange
            const channel = createFakeChannel()
                .attachAcceptChannel(createFakeAcceptChannel())
                .attachFundingTx(createFakeFundingTx());
            const msg = createFakeFundingSignedMessage();

            // act
            channel.attachFundingSigned(msg);

            // assert
            expect(channel.ourSide.nextCommitmentSig.toBuffer()).to.deep.equal(
                Buffer.alloc(64, 0xff),
            );
        });
    });

    describe(Channel.prototype.revokeLocalCommitment.name, () => {
        it("stores the revoked key");

        it("moves next to current and creates next", () => {
            // arrange
            const channel = createFakeChannel()
                .attachAcceptChannel(createFakeAcceptChannel())
                .attachFundingTx(createFakeFundingTx())
                .attachFundingSigned(createFakeFundingSignedMessage());

            // act
            channel.revokeLocalCommitment();

            // assert
            expect(channel.ourSide.commitmentNumber.value).to.equal(0n);
            expect(channel.ourSide.commitmentPoint.toHex()).to.equal(
                "02037803a3228ec3a517835480ffac64c0557d9d75e0fe85861ab0be9eb224e6f8",
            );
            expect(channel.ourSide.commitmentSig.toBuffer().toString("hex")).to.equal(
                "ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff",
            );

            expect(channel.ourSide.nextCommitmentNumber.value).to.equal(1n);
            expect(channel.ourSide.nextCommitmentPoint.toHex()).to.equal(
                "027eed8389cf8eb715d73111b73d94d2c2d04bf96dc43dfd5b0970d80b3617009d",
            );
            expect(channel.ourSide.nextCommitmentSig).to.equal(undefined);
        });
    });
});
