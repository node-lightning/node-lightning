import { BitField } from "../lib/BitField";
import { ILogger, Logger } from "@node-lightning/logger";
import { Readable } from "stream";
import { CommitmentNumber, CommitmentSecret, IPeer, IWireMessage, PeerState } from "../lib";
import { InitFeatureFlags } from "../lib/flags/InitFeatureFlags";
import bech32 from "bech32";
import { IChannelWallet } from "../lib/channels/IChannelWallet";
import Sinon from "sinon";
import {
    Network,
    OutPoint,
    PrivateKey,
    PublicKey,
    Script,
    Tx,
    TxIn,
    TxOut,
    Value,
} from "@node-lightning/bitcoin";
import { bigToBufBE } from "@node-lightning/bufio";
import { Channel } from "../lib/channels/Channel";
import { IChannelLogic } from "../lib/channels/IChannelLogic";
import { Helpers } from "../lib/channels/Helpers";
import { IChannelStorage } from "../lib/channels/IChannelStorage";
import { OpenChannelRequest } from "../lib/channels/OpenChannelRequest";
import { AcceptChannelMessage } from "../lib/messages/AcceptChannelMessage";
import { FundingCreatedMessage } from "../lib/messages/FundingCreatedMessage";
import { IStateMachine } from "../lib/channels/IStateMachine";

export class FakePeer extends Readable implements IPeer {
    public state: PeerState;
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

export function createFakePeer(privateKey?: PrivateKey): FakePeer {
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
        fundTx: Sinon.stub(),
        signTx: Sinon.stub(),
        signFundingTx: Sinon.stub(),
    };
}

export function createFakeKey(
    value: bigint | number,
    network: Network = Network.testnet,
): PrivateKey {
    return new PrivateKey(bigToBufBE(BigInt(value), 32), network);
}

export function createFakeOpenChannelRequest(
    options: Partial<{
        peer: IPeer;
        ourOptions: BitField<InitFeatureFlags>;
        fundingAmount: Value;
        pushAmount: Value;
        maxHtlcInFlightValue: Value;
        minHtlcValue: Value;
        maxAcceptedHtlcs: number;
        channelReserveValue: Value;
        toSelfBlockDelay: number;
        publicChannel: boolean;
    }>,
): OpenChannelRequest {
    return {
        peer: options.peer ?? createFakePeer(),
        fundingAmount: options.fundingAmount ?? Value.fromSats(200_000),
        pushAmount: options.pushAmount ?? Value.fromSats(2_000),
        ourOptions: options.ourOptions ?? new BitField<InitFeatureFlags>(),
        maxHtlcInFlightValue: options.maxHtlcInFlightValue ?? Value.fromMilliSats(20_000),
        minHtlcValue: options.minHtlcValue ?? Value.fromSats(200),
        maxAcceptedHtlcs: options.maxAcceptedHtlcs ?? 30,
        channelReserveValue: options.channelReserveValue ?? Value.fromSats(2_000),
        toSelfBlockDelay: options.toSelfBlockDelay ?? 144,
        publicChannel: options.publicChannel ?? true,
    };
}

export function createFakeChannel(
    options: Partial<{
        peerId: string;
        network: Network;
        isPublic: boolean;
        temporaryId: Buffer;
        fundingAmount: Value;
        pushAmount: Value;
        feeRatePerKw: Value;
        ourDustLimit: Value;
        ourMinHtlcValue: Value;
        ourMaxAcceptedHtlc: number;
        ourMaxInFlightHtlcValue: Value;
        theirChannelReserve: Value;
        theirToSelfDelayBlocks: number;
        ourFundingSecret: PrivateKey;
        ourPaymentSecret: PrivateKey;
        ourDelayedPaymentSecret: PrivateKey;
        ourHtlcSecret: PrivateKey;
        ourRevocationSecret: PrivateKey;
        ourPerCommitmentSeed: Buffer;
    }> = {},
) {
    const peerId = options.peerId ?? (createFakePeer().id as string);
    const network = options.network ?? Network.testnet;
    const channel = new Channel(peerId, network, true);

    channel.temporaryId = options.temporaryId ?? Buffer.alloc(32);
    channel.fundingAmount = options.fundingAmount ?? Value.fromSats(200_000);
    channel.pushAmount = options.pushAmount ?? Value.fromSats(2_000);
    channel.feeRatePerKw = options.feeRatePerKw ?? Value.fromSats(1000);
    channel.isPublic = options.isPublic ?? true;

    channel.ourSide.balance = channel.fundingAmount.subn(channel.pushAmount);
    channel.theirSide.balance = channel.pushAmount;

    channel.ourSide.dustLimit = options.ourDustLimit ?? Value.fromSats(354);
    channel.ourSide.minHtlcValue = options.ourMinHtlcValue ?? Value.fromSats(200);
    channel.ourSide.maxAcceptedHtlc = options.ourMaxAcceptedHtlc ?? 30;
    channel.ourSide.maxInFlightHtlcValue = options.ourMaxInFlightHtlcValue ?? Value.fromMilliSats(20_000); // prettier-ignore
    channel.theirSide.channelReserve = options.theirChannelReserve ?? Value.fromSats(20_000);
    channel.theirSide.toSelfDelayBlocks = options.theirToSelfDelayBlocks ?? 144;

    // create our secrets
    channel.fundingKey = options.ourFundingSecret ?? createFakeKey(1n);
    channel.paymentBasePointSecret = options.ourPaymentSecret ?? createFakeKey(2n);
    channel.delayedBasePointSecret = options.ourDelayedPaymentSecret ?? createFakeKey(3n);
    channel.htlcBasePointSecret = options.ourHtlcSecret ?? createFakeKey(4n);
    channel.revocationBasePointSecret = options.ourRevocationSecret ?? createFakeKey(5n);
    channel.perCommitmentSeed = options.ourPerCommitmentSeed ?? Buffer.alloc(32, 0x00);

    channel.ourSide.nextCommitmentNumber = new CommitmentNumber(0n);
    channel.ourSide.nextCommitmentPoint = CommitmentSecret.privateKey(
        channel.perCommitmentSeed,
        channel.network,
        channel.ourSide.nextCommitmentNumber,
    ).toPubKey(true);

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

export function createFakeAcceptChannel(
    opts: Partial<AcceptChannelMessage> = {},
): AcceptChannelMessage {
    const msg = new AcceptChannelMessage();
    msg.temporaryChannelId = opts.temporaryChannelId ?? Buffer.alloc(32);
    msg.dustLimitValue = opts.dustLimitValue ?? Value.fromSats(354);
    msg.channelReserveValue = opts.channelReserveValue ?? Value.fromSats(20_000);
    msg.minimumDepth = opts.minimumDepth ?? 6;
    msg.toSelfDelay = opts.toSelfDelay ?? 144;
    msg.htlcMinimumValue = opts.htlcMinimumValue ?? Value.fromSats(200);
    msg.maxHtlcValueInFlightValue = opts.maxHtlcValueInFlightValue ?? Value.fromSats(20_000);
    msg.maxAcceptedHtlcs = opts.maxAcceptedHtlcs ?? 30;
    msg.fundingPubKey =
        opts.fundingPubKey ??
        createFakeKey(11n)
            .toPubKey(true)
            .toBuffer();
    msg.paymentBasePoint =
        opts.paymentBasePoint ??
        createFakeKey(12n)
            .toPubKey(true)
            .toBuffer();
    msg.delayedPaymentBasePoint =
        opts.delayedPaymentBasePoint ??
        createFakeKey(13n)
            .toPubKey(true)
            .toBuffer();
    msg.htlcBasePoint =
        opts.htlcBasePoint ??
        createFakeKey(14n)
            .toPubKey(true)
            .toBuffer();
    msg.revocationBasePoint =
        opts.revocationBasePoint ??
        createFakeKey(15n)
            .toPubKey(true)
            .toBuffer();
    msg.firstPerCommitmentPoint =
        opts.firstPerCommitmentPoint ??
        CommitmentSecret.privateKey(
            Buffer.alloc(32, 0xff),
            Network.testnet,
            new CommitmentNumber(0n),
        )
            .toPubKey(true)
            .toBuffer();
    return msg;
}

export function createFakeTxIn(opts: Partial<TxIn> = {}) {
    return new TxIn(
        opts.outpoint ??
            new OutPoint("0000000000000000000000000000000000000000000000000000000000000001", 0),
        opts.scriptSig,
        opts.sequence,
    );
}

export function createFakeTxOut(opts: Partial<TxOut> = {}) {
    return new TxOut(
        opts.value ?? Value.fromSats(800_000),
        Script.p2wpkhLock(
            createFakeKey(1001n)
                .toPubKey(true)
                .hash160(),
        ),
    );
}

export function createFakeFundingTx() {
    return new Tx(
        2,
        [createFakeTxIn()],
        [
            new TxOut(
                Value.fromSats(200_000),
                Script.p2msLock(
                    2,
                    createFakeKey(1n)
                        .toPubKey(true)
                        .toBuffer(),
                    createFakeKey(11n)
                        .toPubKey(true)
                        .toBuffer(),
                ),
            ),
            createFakeTxOut(),
        ],
    );
}

export function createFakeFundingCreatedMessage(
    opts: Partial<{ tx: Tx; sig: Buffer; temporaryChannelId: Buffer }> = {},
) {
    if (!opts.tx) opts.tx = createFakeFundingTx();
    if (!opts.sig) opts.sig = Buffer.alloc(64, 0xff);
    if (!opts.temporaryChannelId) opts.temporaryChannelId = Buffer.alloc(32, 0x00);

    const result = new FundingCreatedMessage();
    result.temporaryChannelId = opts.temporaryChannelId;
    result.fundingTxId = opts.tx.inputs[0].outpoint.txid.serialize();
    result.fundingOutputIndex = opts.tx.inputs[0].outpoint.outputIndex;
    result.signature = opts.sig;
    return result;
}

export function createFakeState(name: string): Sinon.SinonStubbedInstance<IStateMachine> {
    const result: Sinon.SinonStubbedInstance<IStateMachine> = {
        name,
        subStates: new Map(),
        parent: undefined,
        addSubState: Sinon.stub(),
        onEnter: Sinon.stub(),
        onExit: Sinon.stub(),
        onAcceptChannelMessage: Sinon.stub(),
        onPeerConnected: Sinon.stub(),
        onPeerDisconnected: Sinon.stub(),
    };

    result.addSubState.callsFake((state: IStateMachine) => {
        result.subStates.set(state.name, state);
        return result;
    });

    return result;
}
