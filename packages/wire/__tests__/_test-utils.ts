import { Logger, ILogger } from "@node-lightning/logger";
import sinon from "sinon";
import { BitField } from "../lib/BitField";
import { InitFeatureFlags } from "../lib/flags/InitFeatureFlags";

export function createFakePeer() {
    return {
        _handlers: [],
        on(type, handler) {
            this._handlers.push([type, handler, false]);
            return this;
        },

        once(type, handler) {
            this._handlers.push([type, handler, true]);
        },

        off(type, handler) {
            //
        },

        emit(type, msg) {
            const handlers = this._handlers.slice();
            for (let i = 0; i < handlers.length; i++) {
                const handler = handlers[i];
                if (handler[0] !== type) continue;
                handler[1](msg);

                // remove once
                if (handler[2]) {
                    this._handlers.splice(i, 1);
                }
            }
        },
        sendMessage: sinon.stub(),
        pubkey: Buffer.alloc(32, 1),
        localChains: [],
        localFeatures: new BitField<InitFeatureFlags>(),
        remoteChains: [],
        remoteFeatures: new BitField<InitFeatureFlags>(),
    } as any;
}

export function createFakeLogger(): ILogger {
    const fake = sinon.createStubInstance(Logger);
    fake.sub = createFakeLogger as any;
    return fake;
}

export function wait(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}
