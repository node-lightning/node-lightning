import { BitField } from "../lib/BitField";
import { ILogger, Logger } from "@node-lightning/logger";
import { Readable } from "stream";
import { IWireMessage } from "../lib";
import { InitFeatureFlags } from "../lib/flags/InitFeatureFlags";
import bech32 from "bech32";
import { IChannelWallet } from "../lib/channels/IChannelWallet";
import Sinon from "sinon";
import { Network, PrivateKey, PublicKey } from "@node-lightning/bitcoin";
import { bigToBufBE } from "@node-lightning/bufio";

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

    public constructor() {
        super({ objectMode: true });
        this.nodePrivateKey = new PrivateKey(Buffer.alloc(32, 0x1), Network.testnet);
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

export function createFakePeer(): any {
    return new FakePeer();
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

export function createFakeKey(value: bigint, network: Network = Network.testnet): PrivateKey {
    return new PrivateKey(bigToBufBE(value, 32), network);
}
