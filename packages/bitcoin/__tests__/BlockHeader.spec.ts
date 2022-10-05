import { expect } from "chai";
import { HashByteOrder } from "../lib";
import { BlockHeader } from "../lib/BlockHeader";

describe(BlockHeader.name, () => {
    const buf_0 = Buffer.from(
        "0100000000000000000000000000000000000000000000000000000000000000000000003BA3EDFD7A7B12B27AC72C3E67768F617FC81BC3888A51323A9FB8AA4B1E5E4A29AB5F49FFFF001D1DAC2B7C",
        "hex",
    );
    const buf_482738 = Buffer.from(
        "020000208ec39428b17323fa0ddec8e887b4a7c53b8c0a0a220cfd0000000000000000005b0750fce0a889502d40508d39576821155e9c9e3f5c3157f961db38fd8b25be1e77a759e93c0118a4ffd71d",
        "hex",
    );

    describe(BlockHeader.fromBuffer.name, () => {
        it("genesis block", () => {
            const block = BlockHeader.fromBuffer(buf_0);
            expect(block.version).to.equal(1);
            expect(block.previousBlockHash.toString(HashByteOrder.RPC)).to.equal(
                "0000000000000000000000000000000000000000000000000000000000000000",
            );
            expect(block.merkleRoot.toString(HashByteOrder.RPC)).to.equal(
                "4a5e1e4baab89f3a32518a88c31bc87f618f76673e2cc77ab2127b7afdeda33b",
            );
            expect(block.timestamp).to.equal(1231006505);
            expect(block.bits.coefficient).to.equal(65535);
            expect(block.bits.exponent).to.equal(29);
            expect(block.bits.difficulty).to.equal(1n);
            expect(block.nonce).to.equal(2083236893);
        });

        it("block 482738", () => {
            const block = BlockHeader.fromBuffer(buf_482738);
            expect(block.version).to.equal(536870914);
            expect(block.previousBlockHash.toString(HashByteOrder.RPC)).to.equal(
                "000000000000000000fd0c220a0a8c3bc5a7b487e8c8de0dfa2373b12894c38e",
            );
            expect(block.merkleRoot.toString(HashByteOrder.RPC)).to.equal(
                "be258bfd38db61f957315c3f9e9c5e15216857398d50402d5089a8e0fc50075b",
            );
            expect(block.timestamp).to.equal(1504147230);
            expect(block.bits.coefficient).to.equal(81129);
            expect(block.bits.exponent).to.equal(24);
            expect(block.bits.difficulty).to.equal(888171856257n);
            expect(block.nonce).to.equal(500694948);
            // expect(block.hash().toString(HashByteOrder.RPC)).to.equal("asdf");
        });
    });

    describe(BlockHeader.prototype.hash.name, () => {
        it("genesis block", () => {
            const block = BlockHeader.fromBuffer(buf_0);
            expect(block.hash().toString(HashByteOrder.RPC)).to.equal(
                "000000000019d6689c085ae165831e934ff763ae46a2a6c172b3f1b60a8ce26f",
            );
        });

        it("block 482738", () => {
            const block = BlockHeader.fromBuffer(buf_482738);
            expect(block.hash().toString(HashByteOrder.RPC)).to.equal(
                "0000000000000000007e9e4c586439b0cdbe13b1370bdd9435d76a644d047523",
            );
        });
    });

    describe(BlockHeader.prototype.isBip9.name, () => {
        it("genesis block", () => {
            const block = BlockHeader.fromBuffer(buf_0);
            expect(block.isBip9()).to.equal(false);
        });

        it("block 482738", () => {
            const block = BlockHeader.fromBuffer(buf_482738);
            expect(block.isBip9()).to.equal(true);
        });
    });

    describe(BlockHeader.prototype.isBip9Feature.name, () => {
        it("genesis block", () => {
            const block = BlockHeader.fromBuffer(buf_0);
            expect(block.isBip9Feature(1)).to.equal(false);
        });

        it("block 482738", () => {
            const block = BlockHeader.fromBuffer(buf_482738);
            expect(block.isBip9Feature(0)).to.equal(false);
            expect(block.isBip9Feature(1)).to.equal(true);
            expect(block.isBip9Feature(2)).to.equal(false);
        });
    });
});
