import * as crypto from "@node-lightning/crypto";
import { expect } from "chai";
import { OpenChannelMessage } from "../../lib/messages/OpenChannelMessage";
import { Value, Script } from "@node-lightning/core";

describe("OpenChannelMessage", () => {
    // abb00e1f13665a56d7b39917a3afa1a9753191e97541334705e39019c0e3d9b4
    const fundingPubKey = Buffer.from(
        "029510d1d05474cff7beadffa3175354b148ae6e571f42b893e2a0be33fff57dd0",
        "hex",
    );
    // 9bd2577c3f0d164f0da268d601607038eb97326b3d46575a4f6d5b99dbf1e795
    const revocationBasePoint = Buffer.from(
        "03811ed4c385aff9b3084be61e66a8e6572e6b88a6835c83debfbdb70d7f5ad251",
        "hex",
    );
    // 162e9fd408a28d7c7cc8a2b02974e0a8a9eea94b2df14c45c41fb638244b2e3e
    const paymentBasePoint = Buffer.from(
        "02b331b3a6c68de49a28797cb0715ca0955a8ecd56bea30426a6a92997488425ab",
        "hex",
    );
    // ac1efc7f584d738389e46a6456e08af02b7ea5df2e3e8cf4b123c8a2e0be1f32
    const delayedPaymentBasePoint = Buffer.from(
        "03a895e77d461a6bd13cc9d7c2e193de2fa778e06488e6da38340e4bfcf86f038e",
        "hex",
    );
    // 6809997a638e0432ba2d01785d6b06c2b306a70b5723f82c0f18f2875c6b9aa9
    const htlcBasePoint = Buffer.from(
        "02e572d67e4fa4337e6f8b69f156cf3631a2f46f380d22ff1d5a431e6aa7becba3",
        "hex",
    );
    // 17099d21ffe31aab6aa6122cf66c3c95a9fd7cd4973700386ae3f842caf3fddb
    const firstCommitmentPoint = Buffer.from(
        "039889f60bebba5fd2ee18045b3e5e540b46d07acbc768ba8d9ba9e05458ca4d2a",
        "hex",
    );

    describe("serialize", () => {
        it("serializes private", () => {
            const instance = new OpenChannelMessage();
            instance.chainHash = Buffer.from(
                "43497fd7f826957108f4a30fd9cec3aeba79972084e90ead01ea330900000000",
                "hex",
            );
            instance.temporaryChannelId = Buffer.from(
                "0000000000000000000000000000000000000000000000000000000000000000",
                "hex",
            );
            instance.fundingSatoshis = Value.fromSats(200000);
            instance.pushMsat = Value.fromMilliSats(2000);
            instance.dustLimitSatoshis = Value.fromSats(330);
            instance.maxHtlcValueInFlightMsat = Value.fromMilliSats(20000);
            instance.channelReserveSatoshis = Value.fromSats(2000);
            instance.htlcMinimumMsat = Value.fromMilliSats(200);
            instance.feeRatePerKw = Value.fromSats(1000);
            instance.toSelfDelay = 144;
            instance.maxAcceptedHtlcs = 30;
            instance.fundingPubKey = fundingPubKey;
            instance.revocationBasePoint = revocationBasePoint;
            instance.paymentBasePoint = paymentBasePoint;
            instance.delayedPaymentBasePoint = delayedPaymentBasePoint;
            instance.htlcBasePoint = htlcBasePoint;
            instance.firstPerCommitmentPoint = firstCommitmentPoint;
            instance.announceChannel = false;

            expect(instance.serialize().toString("hex")).to.equal(
                "0020" + // type
                "43497fd7f826957108f4a30fd9cec3aeba79972084e90ead01ea330900000000" + // chain_hash
                "0000000000000000000000000000000000000000000000000000000000000000" + // temp_chan_id
                "0000000000030d40" + // funding_satoshis
                "00000000000007d0" + // push_msat
                "000000000000014a" + // dust_limit_satoshis
                "0000000000004e20" + // max_htlc_value_in_flight_msat
                "00000000000007d0" + // channel_reserve_satoshis
                "00000000000000c8" + // htlc_minimum_msat
                "000003e8" + // fee_rate_per_kw
                "0090" + // to_self_delay
                "001e" + // max_accepted_htlcs
                "029510d1d05474cff7beadffa3175354b148ae6e571f42b893e2a0be33fff57dd0" + // funding_pubkey
                "03811ed4c385aff9b3084be61e66a8e6572e6b88a6835c83debfbdb70d7f5ad251" + // revocation_basepoint
                "02b331b3a6c68de49a28797cb0715ca0955a8ecd56bea30426a6a92997488425ab" + // payment_basepoint
                "03a895e77d461a6bd13cc9d7c2e193de2fa778e06488e6da38340e4bfcf86f038e" + // delayed_payment_basepoint
                "02e572d67e4fa4337e6f8b69f156cf3631a2f46f380d22ff1d5a431e6aa7becba3" + // htlc_basepoint
                "039889f60bebba5fd2ee18045b3e5e540b46d07acbc768ba8d9ba9e05458ca4d2a" + // first_per_commitment_point
                "00" // channel_flags
            ); // prettier-ignore
        });

        it("serializes no TLV", () => {
            const instance = new OpenChannelMessage();
            instance.chainHash = Buffer.from(
                "43497fd7f826957108f4a30fd9cec3aeba79972084e90ead01ea330900000000",
                "hex",
            );
            instance.temporaryChannelId = Buffer.from(
                "0000000000000000000000000000000000000000000000000000000000000000",
                "hex",
            );
            instance.fundingSatoshis = Value.fromSats(200000);
            instance.pushMsat = Value.fromMilliSats(2000);
            instance.dustLimitSatoshis = Value.fromSats(330);
            instance.maxHtlcValueInFlightMsat = Value.fromMilliSats(20000);
            instance.channelReserveSatoshis = Value.fromSats(2000);
            instance.htlcMinimumMsat = Value.fromMilliSats(200);
            instance.feeRatePerKw = Value.fromSats(1000);
            instance.toSelfDelay = 144;
            instance.maxAcceptedHtlcs = 30;
            instance.fundingPubKey = fundingPubKey;
            instance.revocationBasePoint = revocationBasePoint;
            instance.paymentBasePoint = paymentBasePoint;
            instance.delayedPaymentBasePoint = delayedPaymentBasePoint;
            instance.htlcBasePoint = htlcBasePoint;
            instance.firstPerCommitmentPoint = firstCommitmentPoint;
            instance.announceChannel = true;

            expect(instance.serialize().toString("hex")).to.equal(
                "0020" + // type
                "43497fd7f826957108f4a30fd9cec3aeba79972084e90ead01ea330900000000" + // chain_hash
                "0000000000000000000000000000000000000000000000000000000000000000" + // temp_chan_id
                "0000000000030d40" + // funding_satoshis
                "00000000000007d0" + // push_msat
                "000000000000014a" + // dust_limit_satoshis
                "0000000000004e20" + // max_htlc_value_in_flight_msat
                "00000000000007d0" + // channel_reserve_satoshis
                "00000000000000c8" + // htlc_minimum_msat
                "000003e8" + // fee_rate_per_kw
                "0090" + // to_self_delay
                "001e" + // max_accepted_htlcs
                "029510d1d05474cff7beadffa3175354b148ae6e571f42b893e2a0be33fff57dd0" + // funding_pubkey
                "03811ed4c385aff9b3084be61e66a8e6572e6b88a6835c83debfbdb70d7f5ad251" + // revocation_basepoint
                "02b331b3a6c68de49a28797cb0715ca0955a8ecd56bea30426a6a92997488425ab" + // payment_basepoint
                "03a895e77d461a6bd13cc9d7c2e193de2fa778e06488e6da38340e4bfcf86f038e" + // delayed_payment_basepoint
                "02e572d67e4fa4337e6f8b69f156cf3631a2f46f380d22ff1d5a431e6aa7becba3" + // htlc_basepoint
                "039889f60bebba5fd2ee18045b3e5e540b46d07acbc768ba8d9ba9e05458ca4d2a" + // first_per_commitment_point
                "01" // channel_flags
            ); // prettier-ignore
        });

        it("serializes with TLV", () => {
            const instance = new OpenChannelMessage();
            instance.chainHash = Buffer.from(
                "43497fd7f826957108f4a30fd9cec3aeba79972084e90ead01ea330900000000",
                "hex",
            );
            instance.temporaryChannelId = Buffer.from(
                "0000000000000000000000000000000000000000000000000000000000000000",
                "hex",
            );
            instance.fundingSatoshis = Value.fromSats(200000);
            instance.pushMsat = Value.fromMilliSats(2000);
            instance.dustLimitSatoshis = Value.fromSats(330);
            instance.maxHtlcValueInFlightMsat = Value.fromMilliSats(20000);
            instance.channelReserveSatoshis = Value.fromSats(2000);
            instance.htlcMinimumMsat = Value.fromMilliSats(200);
            instance.feeRatePerKw = Value.fromSats(1000);
            instance.toSelfDelay = 144;
            instance.maxAcceptedHtlcs = 30;
            instance.fundingPubKey = fundingPubKey;
            instance.revocationBasePoint = revocationBasePoint;
            instance.paymentBasePoint = paymentBasePoint;
            instance.delayedPaymentBasePoint = delayedPaymentBasePoint;
            instance.htlcBasePoint = htlcBasePoint;
            instance.firstPerCommitmentPoint = firstCommitmentPoint;
            instance.announceChannel = true;
            instance.upfrontShutdownScript = Buffer.concat([
                Buffer.from([0x00]),
                crypto.hash160(paymentBasePoint),
            ]);

            expect(instance.serialize().toString("hex")).to.equal(
                "0020" + // type
                "43497fd7f826957108f4a30fd9cec3aeba79972084e90ead01ea330900000000" + // chain_hash
                "0000000000000000000000000000000000000000000000000000000000000000" + // temp_chan_id
                "0000000000030d40" + // funding_satoshis
                "00000000000007d0" + // push_msat
                "000000000000014a" + // dust_limit_satoshis
                "0000000000004e20" + // max_htlc_value_in_flight_msat
                "00000000000007d0" + // channel_reserve_satoshis
                "00000000000000c8" + // htlc_minimum_msat
                "000003e8" + // fee_rate_per_kw
                "0090" + // to_self_delay
                "001e" + // max_accepted_htlcs
                "029510d1d05474cff7beadffa3175354b148ae6e571f42b893e2a0be33fff57dd0" + // funding_pubkey
                "03811ed4c385aff9b3084be61e66a8e6572e6b88a6835c83debfbdb70d7f5ad251" + // revocation_basepoint
                "02b331b3a6c68de49a28797cb0715ca0955a8ecd56bea30426a6a92997488425ab" + // payment_basepoint
                "03a895e77d461a6bd13cc9d7c2e193de2fa778e06488e6da38340e4bfcf86f038e" + // delayed_payment_basepoint
                "02e572d67e4fa4337e6f8b69f156cf3631a2f46f380d22ff1d5a431e6aa7becba3" + // htlc_basepoint
                "039889f60bebba5fd2ee18045b3e5e540b46d07acbc768ba8d9ba9e05458ca4d2a" + // first_per_commitment_point
                "01" + // channel_flags
                "00" + // tlv type 0 (upfront_shutdown_script)
                "15" + // tlv length 21 bytes
                "00a41a8527eab06efc0a8df57045d247784a071e23" // p2wpkh
            ); // prettier-ignore
        });
    });
    describe("deserialize", () => {
        it("deserializes", () => {
            const buf = Buffer.from(
                "0020" + // type
                "43497fd7f826957108f4a30fd9cec3aeba79972084e90ead01ea330900000000" + // chain_hash
                "0000000000000000000000000000000000000000000000000000000000000000" + // temp_chan_id
                "0000000000030d40" + // funding_satoshis
                "00000000000007d0" + // push_msat
                "000000000000014a" + // dust_limit_satoshis
                "0000000000004e20" + // max_htlc_value_in_flight_msat
                "00000000000007d0" + // channel_reserve_satoshis
                "00000000000000c8" + // htlc_minimum_msat
                "000003e8" + // fee_rate_per_kw
                "0090" + // to_self_delay
                "001e" + // max_accepted_htlcs
                "029510d1d05474cff7beadffa3175354b148ae6e571f42b893e2a0be33fff57dd0" + // funding_pubkey
                "03811ed4c385aff9b3084be61e66a8e6572e6b88a6835c83debfbdb70d7f5ad251" + // revocation_basepoint
                "02b331b3a6c68de49a28797cb0715ca0955a8ecd56bea30426a6a92997488425ab" + // payment_basepoint
                "03a895e77d461a6bd13cc9d7c2e193de2fa778e06488e6da38340e4bfcf86f038e" + // delayed_payment_basepoint
                "02e572d67e4fa4337e6f8b69f156cf3631a2f46f380d22ff1d5a431e6aa7becba3" + // htlc_basepoint
                "039889f60bebba5fd2ee18045b3e5e540b46d07acbc768ba8d9ba9e05458ca4d2a" + // first_per_commitment_point
                "01" + // channel_flags
                "00" + // tlv type 0 (upfront_shutdown_script)
                "15" + // tlv length 21 bytes
                "00a41a8527eab06efc0a8df57045d247784a071e23" // p2wpkh
                , "hex"
            ); // prettier-ignore

            const instance = OpenChannelMessage.deserialize(buf);
            expect(instance.chainHash).to.deep.equal(
                Buffer.from(
                    "43497fd7f826957108f4a30fd9cec3aeba79972084e90ead01ea330900000000",
                    "hex",
                ),
            );
            expect(instance.temporaryChannelId).to.deep.equal(
                Buffer.from(
                    "0000000000000000000000000000000000000000000000000000000000000000",
                    "hex",
                ),
            );
            expect(instance.fundingSatoshis.sats).to.equal(BigInt(200000));
            expect(instance.pushMsat.msats).to.equal(BigInt(2000));
            expect(instance.dustLimitSatoshis.sats).to.equal(BigInt(330));
            expect(instance.maxHtlcValueInFlightMsat.msats).to.equal(BigInt(20000));
            expect(instance.channelReserveSatoshis.sats).to.equal(BigInt(2000));
            expect(instance.htlcMinimumMsat.msats).to.equal(BigInt(200));
            expect(Number(instance.feeRatePerKw.sats)).to.equal(1000);
            expect(instance.toSelfDelay).to.equal(144);
            expect(instance.maxAcceptedHtlcs).to.equal(30);
            expect(instance.fundingPubKey).to.deep.equal(fundingPubKey);
            expect(instance.revocationBasePoint).to.deep.equal(revocationBasePoint);
            expect(instance.paymentBasePoint).to.deep.equal(paymentBasePoint);
            expect(instance.delayedPaymentBasePoint).to.deep.equal(delayedPaymentBasePoint);
            expect(instance.htlcBasePoint).to.deep.equal(htlcBasePoint);
            expect(instance.firstPerCommitmentPoint).to.deep.equal(firstCommitmentPoint);
            expect(instance.announceChannel).to.equal(true);
            expect(instance.upfrontShutdownScript).to.deep.equal(
                Buffer.concat([Buffer.from([0x00]), crypto.hash160(paymentBasePoint)]),
            );
        });
    });
});
