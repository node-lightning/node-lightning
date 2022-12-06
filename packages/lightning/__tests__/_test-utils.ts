import { BitField } from "../lib/BitField";
import { ILogger, Logger } from "@node-lightning/logger";
import { Readable } from "stream";
import { IWireMessage } from "../lib";
import { InitFeatureFlags } from "../lib/flags/InitFeatureFlags";
import bech32 from "bech32";
import { IChannelWallet } from "../lib/channels/IChannelWallet";
import Sinon from "sinon";
import { Network, PrivateKey, PublicKey, Value } from "@node-lightning/bitcoin";
import { bigToBufBE } from "@node-lightning/bufio";
import { Channel } from "../lib/channels/Channel";
import { ChannelSide } from "../lib/channels/ChannelSide";
import { IChannelLogic } from "../lib/channels/IChannelLogic";
import { Helpers } from "../lib/channels/Helpers";
import { StateMachine } from "../lib/channels/StateMachine";
import { IChannelStorage } from "../lib/channels/IChannelStorage";

export class FakePeer extends Readable {
    public state;
    public send = Sinon.stub();
    public sendMessage = Sinon.stub();
    public nodePrivateKey: PrivateKey;
    public nodePublicKey: PublicKey;
    public id: string;
    public localChains: Buffer[] = [];
    public localFeatures = new BitField<InitFeatureFlags>();
    public remoteChains: Buffer[] = [];
    public remoteFeatures = new BitField<InitFeatureFlags>();

    public constructor(
        privateKey: PrivateKey = new PrivateKey(Buffer.alloc(32, 0x1), Network.testnet),
    ) {
        super({ objectMode: true });
        this.nodePrivateKey = privateKey;
        this.nodePublicKey = this.nodePrivateKey.toPubKey(true);
        this.id = this.nodePublicKey.toHex();
    }

    public _read() {
        //
    }

    public fakeMessage(msg: IWireMessage) {
        this.push(msg);
    }

    public disconnect() {
        //
    }
}

export function createFakePeer(privateKey?: PrivateKey): any {
    return new FakePeer(privateKey);
}

export function createFakeLogger(): ILogger {
    const fake = Sinon.createStubInstance(Logger);
    fake.sub = createFakeLogger as any;
    return fake;
}

export function wait(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export function bech32Decode(bech32PublicKey: string): Buffer {
    const { words } = bech32.decode(bech32PublicKey);
    return Buffer.from(bech32.fromWords(words));
}

export function createFakeChannelWallet(): Sinon.SinonStubbedInstance<IChannelWallet> {
    return {
        getFeeRatePerKw: Sinon.stub(),
        getDustLimit: Sinon.stub(),
        checkWalletHasFunds: Sinon.stub(),
        createFundingKey: Sinon.stub(),
        createBasePointSecrets: Sinon.stub(),
        createPerCommitmentSeed: Sinon.stub(),
    };
}

export function createFakeKey(
    value: bigint | number,
    network: Network = Network.testnet,
): PrivateKey {
    return new PrivateKey(bigToBufBE(BigInt(value), 32), network);
}

export function createFakeChannel(
    options: Partial<{
        peerId: string;
        network: Network;
        isFunder: boolean;
        isPublic: boolean;
        temporaryId: Buffer;
        fundingAmount: Value;
        pushAmount: Value;
        feeRatePerKw: Value;
        ourSide: Partial<ChannelSide>;
        theirSide: Partial<ChannelSide>;
        ourFundingSecret: PrivateKey;
        ourPaymentSecret: PrivateKey;
        ourDelayedPaymentSecret: PrivateKey;
        ourHtlcSecret: PrivateKey;
        ourRevocationSecret: PrivateKey;
        ourPerCommitmentSeed: Buffer;
    }>,
): Channel {
    const peerId = options.peerId ?? (createFakePeer().id as string);
    const network = options.network ?? Network.testnet;
    const isFunder = options.isFunder ?? true;
    const channel = new Channel(peerId, network, isFunder);

    channel.temporaryId = options.temporaryId ?? Buffer.alloc(32);
    channel.fundingAmount = options.fundingAmount ?? Value.fromSats(200_000);
    channel.pushAmount = options.pushAmount ?? Value.fromSats(2_000);
    channel.feeRatePerKw = options.feeRatePerKw ?? Value.fromSats(1000);
    channel.isPublic = options.isPublic ?? true;
    channel.ourSide.dustLimit = options.ourSide?.dustLimit ?? Value.fromSats(330);
    channel.ourSide.minHtlcValue = options.ourSide?.minHtlcValue ?? Value.fromSats(200);
    channel.ourSide.maxAcceptedHtlc = options.ourSide?.maxAcceptedHtlc ?? 30;
    channel.ourSide.maxInFlightHtlcValue = options.ourSide?.maxInFlightHtlcValue ?? Value.fromMilliSats(20_000); // prettier-ignore

    channel.theirSide.channelReserve = options.theirSide?.channelReserve ?? Value.fromSats(2_000);
    channel.theirSide.toSelfDelayBlocks = options.theirSide?.toSelfDelayBlocks ?? 144;

    channel.fundingKey = options.ourFundingSecret ?? createFakeKey(1n);
    channel.paymentBasePointSecret = options.ourPaymentSecret ?? createFakeKey(2n);
    channel.delayedBasePointSecret = options.ourDelayedPaymentSecret ?? createFakeKey(3n);
    channel.htlcBasePointSecret = options.ourHtlcSecret ?? createFakeKey(4n);
    channel.revocationBasePointSecret = options.ourRevocationSecret ?? createFakeKey(5n);
    channel.perCommitmentSeed = options.ourPerCommitmentSeed ?? Buffer.alloc(32);
    channel.ourSide.commitmentPoint = channel
        .getPerCommitmentSecret(channel.ourSide.commitmentNumber)
        .toPubKey(true);

    return channel;
}

export function createFakeChannelLogicFacade(): Sinon.SinonStubbedInstance<IChannelLogic> {
    return Sinon.createStubInstance(Helpers);
}

export function createFakeChannelStorage(): Sinon.SinonStubbedInstance<IChannelStorage> {
    return {
        save: Sinon.stub(),
    };
}
