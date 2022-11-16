import { BitField } from "@node-lightning/core";
import { ILogger, Logger } from "@node-lightning/logger";
import sinon from "sinon";
import { Readable } from "stream";
import { IWireMessage } from "../lib";
import { InitFeatureFlags } from "../lib/flags/InitFeatureFlags";
import bech32 from "bech32";

export class FakePeer extends Readable {
    public state;
    public send = sinon.stub();
    public sendMessage = sinon.stub();
    public pubkey = Buffer.alloc(32, 1);
    public localChains: Buffer[] = [];
    public localFeatures = new BitField<InitFeatureFlags>();
    public remoteChains: Buffer[] = [];
    public remoteFeatures = new BitField<InitFeatureFlags>();

    public constructor() {
        super({ objectMode: true });
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

export function createFakePeer(): FakePeer {
    return new FakePeer();
}

export function createFakeLogger(): ILogger {
    const fake = sinon.createStubInstance(Logger);
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
