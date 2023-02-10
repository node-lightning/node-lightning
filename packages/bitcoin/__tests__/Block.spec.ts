import { sha256 } from "@node-lightning/crypto";
import { expect } from "chai";
import { Block, HashByteOrder, Tx } from "../lib";
import block0 from "../__fixtures__/block_0.json";
import block768274 from "../__fixtures__/block_768274.json";

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

        it("parse block 768274", () => {
            // arrange
            const hex = Buffer.from(block768274.hex, "hex");

            // act
            const block = Block.fromBuffer(hex);

            // assert
            expect(block.version).to.equal(0x21002000);
            expect(block.previousBlockHash.toString(HashByteOrder.RPC)).to.equal(
                "00000000000000000002e626d9b263aabbbb404daf66fc0e1b4d2ea62bd82c32",
            );
            expect(block.merkleRoot.toString(HashByteOrder.RPC)).to.equal(
                "df7936cb1360ac6f34ef6023b1a0375ee215001eae61ea1c1fb49f0c96cf12fa",
            );
            expect(block.timestamp).to.equal(1671578263);
            expect(block.bits.coefficient).to.equal(0x07f590);
            expect(block.bits.exponent).to.equal(0x17);
            expect(block.bits.difficulty).to.equal(35364065900457n);
            expect(block.nonce).to.equal(0xf092d519);
            expect(block.txs.length).to.equal(1);
            expect(block.txs[0].version).to.equal(1);
            expect(block.txs[0].locktime.value).to.equal(0);
            expect(block.txs[0].inputs.length).to.equal(1);
            expect(block.txs[0].inputs[0].outpoint.toString()).to.equal(
                "0000000000000000000000000000000000000000000000000000000000000000:4294967295",
            );
            expect(block.txs[0].inputs[0].scriptSig.toString()).to.equal(
                "0312b90b1b4d696e656420627920416e74506f6f6c3835323601ff0076dcc16ffabe6d6db88c7cf9261b1b9811d47e594bbf0928d66444efb12e9bd1924d675879d25dfb02000000000000000000b6233400000000070000",
            );
            expect(block.txs[0].outputs.length).to.equal(3);
            expect(block.txs[0].outputs[0].value.bitcoin).to.equal(6.25);
            expect(block.txs[0].outputs[0].scriptPubKey.toString()).to.equal(
                "a9144b09d828dfc8baaba5d04ee77397e04b1050cc7387",
            );
            expect(block.txs[0].outputs[1].value.bitcoin).to.equal(0);
            expect(block.txs[0].outputs[1].scriptPubKey.toString()).to.equal(
                "6a24aa21a9ede2f61c3f71d1defd3fa999dfa36953755c690689799962b48bebd836974e8cf9",
            );
            expect(block.txs[0].outputs[2].value.bitcoin).to.equal(0);
            expect(block.txs[0].outputs[2].scriptPubKey.toString()).to.equal(
                "6a2952534b424c4f434b3adcf3e393ea227879dd402081964eb1b65d2e1cdcf243855201b8ab28004acdd6",
            );
        });
    });

    describe(Block.prototype.toBuffer.name, () => {
        it("serializes block 0", () => {
            // arrange
            const hex = Buffer.from(block0.hex, "hex");
            const block = Block.fromBuffer(hex);

            // act
            const buffer = block.toBuffer();

            // assert
            expect(buffer.toString("hex")).to.equal(block0.hex);
        });

        it("serializes block 768274", () => {
            // arrange
            const hex = Buffer.from(block768274.hex, "hex");
            const block = Block.fromBuffer(hex);

            // act
            const buffer = block.toBuffer();

            // assert
            expect(buffer.toString("hex")).to.equal(block768274.hex);
        });
    });

    describe(Block.prototype.hash.name, () => {
        it("block 0", () => {
            // arrange
            const block = Block.fromHex(block0.hex);

            // act
            const hash = block.hash();

            // assert
            expect(hash.toString(HashByteOrder.RPC)).to.equal(
                "000000000019d6689c085ae165831e934ff763ae46a2a6c172b3f1b60a8ce26f",
            );
        });

        it("block 768274", () => {
            // arrange
            const block = Block.fromHex(block768274.hex);

            // act
            const hash = block.hash();

            // assert
            expect(hash.toString(HashByteOrder.RPC)).to.equal(
                "00000000000000000004a792625715b4ae1ae3a0a300310855a010463aeb5d46",
            );
        });
    });

    describe("coinbase", () => {
        it("block 0", () => {
            // arrange
            const hex = Buffer.from(block0.hex, "hex");
            const block = Block.fromBuffer(hex);

            // act
            const tx = block.coinbase;

            // assert
            expect(tx).to.be.instanceOf(Tx);
            expect(tx.inputs.length).to.equal(1);
            expect(tx.inputs[0].outpoint.toString()).to.equal(
                "0000000000000000000000000000000000000000000000000000000000000000:4294967295",
            );
        });

        it("block 768274", () => {
            // arrange
            const hex = Buffer.from(block768274.hex, "hex");
            const block = Block.fromBuffer(hex);

            // act
            const tx = block.coinbase;

            // assert
            expect(tx).to.be.instanceOf(Tx);
            expect(tx.inputs.length).to.equal(1);
            expect(tx.inputs[0].outpoint.toString()).to.equal(
                "0000000000000000000000000000000000000000000000000000000000000000:4294967295",
            );
        });
    });

    describe("bip34Height", () => {
        it("returns undefined when not available", () => {
            // arrange
            const hex = Buffer.from(block0.hex, "hex");
            const block = Block.fromBuffer(hex);

            // act
            const height = block.bip34Height;

            // assert
            expect(height).to.equal(undefined);
        });

        it("returns height when available", () => {
            // arrange
            const hex = Buffer.from(block768274.hex, "hex");
            const block = Block.fromBuffer(hex);

            // act
            const height = block.bip34Height;

            // assert
            expect(height).to.equal(768274n);
        });
    });

    it("hash", () => {
        const block = Block.fromHex(
            "008076259ee474a2ed19af9a1d5d22f631ed180df860f6f28ec5f3ef28d90000000000002d0f180bee604c22450db0a0119916be1e5809c556d9df3bb2885fd671487d0d0a01606300413f1c09249da901010000000001010000000000000000000000000000000000000000000000000000000000000000ffffffff19032d5724012012090909200909200904decf008f0800000000ffffffff02be40250000000000160014820d4a343a44e915c36494995c2899abe37418930000000000000000266a24aa21a9ede2f61c3f71d1defd3fa999dfa36953755c690689799962b48bebd836974e8cf90120000000000000000000000000000000000000000000000000000000000000000000000000",
        );
        expect(block.hash().toString(HashByteOrder.RPC)).to.equal(
            "000000000000d5998701b045574a2fe3b940bf3733e83a95ecfb598e7336f5db",
        );
    });
});
