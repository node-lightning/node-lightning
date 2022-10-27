import { expect } from "chai";
import { Block, HashByteOrder } from "../lib";
import block0 from "../__fixtures__/block_0.json";

describe(Block.name, () => {
    describe(Block.fromBuffer.name, () => {
        it("parse block 0", () => {
            // arrange
            const hex = Buffer.from(block0.hex, "hex");

            // act
            const block = Block.fromBuffer(hex);

            // assert
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
            expect(block.txs.length).to.equal(1);
            expect(block.txs[0].version).to.equal(1);
            expect(block.txs[0].locktime.value).to.equal(0);
            expect(block.txs[0].inputs.length).to.equal(1);
            expect(block.txs[0].inputs[0].outpoint.toString()).to.equal(
                "0000000000000000000000000000000000000000000000000000000000000000:4294967295",
            );
            expect(block.txs[0].inputs[0].scriptSig.serialize().toString("hex")).to.equal(
                "4d04ffff001d0104455468652054696d65732030332f4a616e2f32303039204368616e63656c6c6f72206f6e206272696e6b206f66207365636f6e64206261696c6f757420666f722062616e6b73",
            );
            expect(block.txs[0].outputs.length).to.equal(1);
            expect(block.txs[0].outputs[0].value.bitcoin).to.equal(50.0);
            expect(block.txs[0].outputs[0].scriptPubKey.serialize().toString("hex")).to.equal(
                "434104678afdb0fe5548271967f1a67130b7105cd6a828e03909a67962e0ea1f61deb649f6bc3f4cef38c4f35504e51ec112de5c384df7ba0b8d578a4c702b6bf11d5fac",
            );
        });
    });

    describe(Block.prototype.toBuffer.name, () => {
        it("serialize block 0", () => {
            // arrange
            const hex = Buffer.from(block0.hex, "hex");
            const block = Block.fromBuffer(hex);

            // act
            const buffer = block.toBuffer();

            // assert
            expect(buffer.toString("hex")).to.equal(block0.hex);
        });
    });
});
