import { expect } from "chai";
import { Channel } from "../../lib/channels/Channel";
import { createFakeAcceptChannel, createFakeChannel } from "../_test-utils";

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
});
