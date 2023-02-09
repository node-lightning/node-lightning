/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-var-requires */

import sinon from "sinon";
import { expect } from "chai";
import { BlockWatcher } from "../lib/BlockWatcher";
import { BitcoindClient } from "../../bitcoind";
import { HashByteOrder } from "@node-lightning/bitcoin";

const TestnetHeaders = require("../__fixtures__/TestnetHeaders2.json");
const headerLookup: any = hash => TestnetHeaders[hash];

const TestnetBlocks = require("../__fixtures__/TestnetBlocks2.json");
const blockLookup: (hash: string) => Promise<Buffer> = (hash: string) =>
    Promise.resolve(Buffer.from(TestnetBlocks[hash], "hex"));

const stale = "000000000000d928eff3c58ef2f660f80d18ed31f6225d1d9aaf19eda274e49e";
const common = "000000000e0c41e51bcc6f005b72b0cf694a0aaec61ce052850aff7fca941cd9";
const common_plus_1 = "0000000002bb108d93bd491061d7312ad9299c8c916630754709dff0ec04a60f";
const common_plus_2 = "00000000171bd3b4b88e3fed065df77ed2fc194fc3a84b0265ccf0548db3c839";

describe("BlockWatcher", () => {
    let bitcoind: sinon.SinonStubbedInstance<BitcoindClient>;

    beforeEach(() => {
        bitcoind = sinon.createStubInstance(BitcoindClient);
        bitcoind.getHeader.callsFake(headerLookup);
        bitcoind.getBestBlockHash.resolves(common_plus_2);
        bitcoind.getRawBlock.callsFake(blockLookup);
    });

    describe("._sync()", () => {
        it("should handle reorg", async () => {
            const onConnect = sinon.stub();
            const onDisconnect = sinon.stub();
            const hash = stale;

            const sut = new BlockWatcher(bitcoind, hash, onConnect, onDisconnect);
            await (sut as any)._sync();
            expect(onDisconnect.callCount).to.equal(1);
            expect(onDisconnect.args[0][0].hash().toString(HashByteOrder.RPC)).to.equal(stale);

            expect(onConnect.callCount).to.equal(2);
            expect(onConnect.args[0][0].hash().toString(HashByteOrder.RPC)).to.equal(common_plus_1);
            expect(onConnect.args[1][0].hash().toString(HashByteOrder.RPC)).to.equal(common_plus_2);
        });

        it("should continue chain", async () => {
            const onConnect = sinon.stub();
            const onDisconnect = sinon.stub();
            const hash = common;

            const sut = new BlockWatcher(bitcoind, hash, onConnect, onDisconnect, null);
            await (sut as any)._sync();
            expect(onDisconnect.callCount).to.equal(0);

            expect(onConnect.callCount).to.equal(2);
            expect(onConnect.args[0][0].hash().toString(HashByteOrder.RPC)).to.equal(common_plus_1);
            expect(onConnect.args[1][0].hash().toString(HashByteOrder.RPC)).to.equal(common_plus_2);
        });

        it("should do nothing when same", async () => {
            const onConnect = sinon.stub();
            const onDisconnect = sinon.stub();
            const hash = common_plus_2;

            const sut = new BlockWatcher(bitcoind as any, hash, onConnect, onDisconnect, null);
            await (sut as any)._sync();
            expect(onDisconnect.callCount).to.equal(0);
            expect(onConnect.callCount).to.equal(0);
        });
    });
});
