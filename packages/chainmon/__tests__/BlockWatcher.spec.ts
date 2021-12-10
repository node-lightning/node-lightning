/* eslint-disable @typescript-eslint/no-var-requires */

import sinon from "sinon";
import { expect } from "chai";
import { BlockWatcher } from "../lib/BlockWatcher";
import { BitcoindClient } from "../../bitcoind";

const TestnetHeaders = require("../__fixtures__/TestnetHeaders.json");
const headerLookup: any = hash => TestnetHeaders[hash];

const TestnetBlocks = require("../__fixtures__/TestnetBlocks.json");
const blockLookup: any = hash => TestnetBlocks[hash];

describe("BlockWatcher", () => {
    let bitcoind: sinon.SinonStubbedInstance<BitcoindClient>;

    beforeEach(() => {
        bitcoind = sinon.createStubInstance(BitcoindClient);
        bitcoind.getHeader.callsFake(headerLookup);
        bitcoind.getBestBlockHash.resolves("0000000000bf27f2b81c3091ee3d25b1e48f485b06ae85ac50b7faa86857a60d"); // prettier-ignore
        bitcoind.getBlockSummary.callsFake(blockLookup);
    });

    describe("._sync()", () => {
        it("should handle reorg", async () => {
            const onConnect = sinon.stub();
            const onDisconnect = sinon.stub();
            const hash = "0000000000f65e714a2cdbf191b621c706f1fc77d12ceb9de8a9609487687f1f";

            const sut = new BlockWatcher(bitcoind as any, hash, onConnect, onDisconnect);
            await (sut as any)._sync();
            expect(onDisconnect.callCount).to.equal(1);
            expect(onDisconnect.args[0][0]).to.deep.equal(blockLookup("0000000000f65e714a2cdbf191b621c706f1fc77d12ceb9de8a9609487687f1f")); // prettier-ignore

            expect(onConnect.callCount).to.equal(2);
            expect(onConnect.args[0][0]).to.deep.equal(blockLookup("0000000000850925fd57eb2799a4687f7748507aa831e214b57be1fbe68f451f")); // prettier-ignore
            expect(onConnect.args[1][0]).to.deep.equal(blockLookup("0000000000bf27f2b81c3091ee3d25b1e48f485b06ae85ac50b7faa86857a60d")); // prettier-ignore
        });

        it("should continue chain", async () => {
            const onConnect = sinon.stub();
            const onDisconnect = sinon.stub();
            const hash = "00000000032415dee48b1541cfe6c46a691350eb37493a6d2924b0452c4626c2";

            const sut = new BlockWatcher(bitcoind as any, hash, onConnect, onDisconnect, null);
            await (sut as any)._sync();
            expect(onDisconnect.callCount).to.equal(0);

            expect(onConnect.callCount).to.equal(2);
            expect(onConnect.args[0][0]).to.deep.equal(blockLookup("0000000000850925fd57eb2799a4687f7748507aa831e214b57be1fbe68f451f")); // prettier-ignore
            expect(onConnect.args[1][0]).to.deep.equal(blockLookup("0000000000bf27f2b81c3091ee3d25b1e48f485b06ae85ac50b7faa86857a60d")); // prettier-ignore
        });

        it("should do nothing when same", async () => {
            const onConnect = sinon.stub();
            const onDisconnect = sinon.stub();
            const hash = "0000000000bf27f2b81c3091ee3d25b1e48f485b06ae85ac50b7faa86857a60d";

            const sut = new BlockWatcher(bitcoind as any, hash, onConnect, onDisconnect, null);
            await (sut as any)._sync();
            expect(onDisconnect.callCount).to.equal(0);
            expect(onConnect.callCount).to.equal(0);
        });
    });
});
