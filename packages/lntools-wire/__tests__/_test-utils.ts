import { Logger } from "@lntools/logger";
import sinon from "sinon";

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
  } as any;
}

export function createFakeLogger() {
  const fake = sinon.createStubInstance(Logger);
  fake.sub = createFakeLogger;
  return fake;
}
