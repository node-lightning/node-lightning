import { expect } from "chai";
import sinon from "sinon";
import { BitcoindClient } from "@node-lightning/bitcoind";
import { BlockDiffer } from "../lib/BlockDiffer";

const TestnetHeaders = require("../__fixtures__/TestnetHeaders.json");
const headerLookup: any = hash => TestnetHeaders[hash];

describe("BlockDiffer", () => {
    let bitcoind: sinon.SinonStubbedInstance<BitcoindClient>;

    beforeEach(() => {
        bitcoind = sinon.createStubInstance(BitcoindClient);
        bitcoind.getHeader.callsFake(headerLookup);
    });

    describe(".diff()", () => {
        it("reorg of equal height", async () => {
            // testnet fork with reorg depth of 2
            const last = headerLookup("0000000000cdcf4a51958484f957885def175df543051593f2dd834982abf735"); // prettier-ignore
            const current = headerLookup("0000000000bf27f2b81c3091ee3d25b1e48f485b06ae85ac50b7faa86857a60d"); // prettier-ignore
            const sut = new BlockDiffer(bitcoind as any);
            const result = await sut.diff(current, last);
            expect(result.commonAncestor.hash).to.equal("00000000032415dee48b1541cfe6c46a691350eb37493a6d2924b0452c4626c2"); // prettier-ignore
            expect(result.disconnects[0].hash).to.equal("0000000000cdcf4a51958484f957885def175df543051593f2dd834982abf735"); // prettier-ignore
            expect(result.disconnects[1].hash).to.equal("0000000000f65e714a2cdbf191b621c706f1fc77d12ceb9de8a9609487687f1f"); // prettier-ignore
            expect(result.connects[0].hash).to.equal("0000000000850925fd57eb2799a4687f7748507aa831e214b57be1fbe68f451f"); // prettier-ignore
            expect(result.connects[1].hash).to.equal("0000000000bf27f2b81c3091ee3d25b1e48f485b06ae85ac50b7faa86857a60d"); // prettier-ignore
        });

        it("reorg of lesser height", async () => {
            // testnet fork with reorg depth of 1
            const last = headerLookup("0000000000f65e714a2cdbf191b621c706f1fc77d12ceb9de8a9609487687f1f"); // prettier-ignore
            const current = headerLookup("0000000000bf27f2b81c3091ee3d25b1e48f485b06ae85ac50b7faa86857a60d"); // prettier-ignore
            const sut = new BlockDiffer(bitcoind as any);
            const result = await sut.diff(current, last);
            expect(result.commonAncestor.hash).to.equal("00000000032415dee48b1541cfe6c46a691350eb37493a6d2924b0452c4626c2"); // prettier-ignore
            expect(result.disconnects[0].hash).to.equal("0000000000f65e714a2cdbf191b621c706f1fc77d12ceb9de8a9609487687f1f"); // prettier-ignore
            expect(result.connects[0].hash).to.equal("0000000000850925fd57eb2799a4687f7748507aa831e214b57be1fbe68f451f"); // prettier-ignore
            expect(result.connects[1].hash).to.equal("0000000000bf27f2b81c3091ee3d25b1e48f485b06ae85ac50b7faa86857a60d"); // prettier-ignore
        });

        it("no reorg", async () => {
            // testnet fork with reorg depth of 1
            const last = headerLookup("00000000032415dee48b1541cfe6c46a691350eb37493a6d2924b0452c4626c2"); // prettier-ignore
            const current = headerLookup("0000000000bf27f2b81c3091ee3d25b1e48f485b06ae85ac50b7faa86857a60d"); // prettier-ignore
            const sut = new BlockDiffer(bitcoind as any);
            const result = await sut.diff(current, last);
            expect(result.commonAncestor.hash).to.equal("00000000032415dee48b1541cfe6c46a691350eb37493a6d2924b0452c4626c2"); // prettier-ignore
            expect(result.disconnects.length).to.equal(0);
            expect(result.connects[0].hash).to.equal("0000000000850925fd57eb2799a4687f7748507aa831e214b57be1fbe68f451f"); // prettier-ignore
            expect(result.connects[1].hash).to.equal("0000000000bf27f2b81c3091ee3d25b1e48f485b06ae85ac50b7faa86857a60d"); // prettier-ignore
        });
    });
});
