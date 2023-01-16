import fs from "fs/promises";
import path from "path";
import { IChannelStorage } from "@node-lightning/lightning";
import { Channel } from "@node-lightning/lightning/dist/channels/Channel";
import { ChannelSide } from "@node-lightning/lightning/dist/channels/ChannelSide";

export class ChannelStorage implements IChannelStorage {
    constructor(readonly folder: string) {}

    /**
     * Incredibly basic storage mechanism. This does not encrypt sensitive data
     * nor take any measures to ensure disk-write failures do not wipe out
     * existing data.
     * @param channel
     */
    public async save(channel: Channel): Promise<void> {
        const json = {
            channelId: channel.channelId.toHex(),
            delayedBasePointSecret: channel.delayedBasePointSecret.toHex(),
            feeRatePerKw: channel.feeRatePerKw.bitcoin,
            funder: channel.funder,
            fundingAmount: channel.fundingAmount.bitcoin,
            fundingConfirmedHeight: channel.fundingConfirmedHeight,
            fundingKey: channel.fundingKey.toHex(),
            fundingOutPoint: channel.fundingOutPoint?.toString(),
            fundingScript: channel.fundingScript?.toHex(),
            fundingTx: channel.fundingTx?.toHex(),
            htlcBasePointSecret: channel.htlcBasePointSecret.toHex(),
            isPublic: channel.isPublic,
            minimumDepth: channel.minimumDepth,
            network: channel.network.name,
            openBlockHeight: channel.openBlockHeight,
            ourSide: this.channelSideToJson(channel.ourSide),
            paymentBasePointSecret: channel.paymentBasePointSecret.toHex(),
            peerId: channel.peerId,
            perCommitmentSeed: channel.perCommitmentSeed.toString("hex"),
            pushAmount: channel.pushAmount.bitcoin,
            revocationBasePointSecret: channel.revocationBasePointSecret.toHex(),
            state: channel.state.name,
            temporaryId: channel.temporaryId.toString("hex"),
            theirSide: this.channelSideToJson(channel.theirSide),
        };
        const filename = `channel_${channel.channelId.toString()}.json`;
        await fs.writeFile(path.join(this.folder, filename), JSON.stringify(json));
    }

    public channelSideToJson(side: ChannelSide) {
        return {
            balance: side.balance?.bitcoin,
            channelReserve: side.channelReserve?.bitcoin,
            commitmentNumber: side.commitmentNumber?.value,
            commitmentPoint: side.commitmentPoint?.toHex(),
            commitmentSig: side.commitmentSig?.toHex(),
            delayedBasePoint: side.delayedBasePoint?.toHex(),
            dustLimit: side.dustLimit?.bitcoin,
            fundingPubKey: side.fundingPubKey?.toHex(),
            htlcBasePoint: side.htlcBasePoint?.toHex(),
            htlcCounter: side.htlcCounter,
            maxAcceptedHtlc: side.maxAcceptedHtlc,
            maxInFlightHtlcValue: side.maxInFlightHtlcValue?.bitcoin,
            minHtlcValue: side.minHtlcValue?.bitcoin,
            nextCommitmentNumber: side.nextCommitmentNumber?.value,
            nextCommitmentPoint: side.nextCommitmentPoint?.toHex(),
            nextCommitmentSig: side.nextCommitmentSig?.toHex(),
            paymentBasePoint: side.paymentBasePoint.toHex(),
            revocationBasePoint: side.revocationBasePoint.toHex(),
            toSelfDelayBlocks: side.toSelfDelayBlocks,
        };
    }
}
