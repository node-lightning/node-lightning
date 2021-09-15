import { BitField } from "@node-lightning/core";
import { ILogger, Logger } from "@node-lightning/logger";
import sinon from "sinon";
import { Readable } from "stream";
import { IWireMessage } from "../lib";
import { InitFeatureFlags } from "../lib/flags/InitFeatureFlags";

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
}

export function createFakePeer() {
    return new FakePeer() as any;
}

export function createFakeLogger(): ILogger {
    const fake = sinon.createStubInstance(Logger);
    fake.sub = createFakeLogger as any;
    return fake;
}

export function wait(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}
