import { StreamReader } from "@node-lightning/bufio";
import { expect } from "chai";
import { Tx } from "../lib/Tx";

describe("Tx", () => {
    describe("#.parse()", () => {
        it("parses legacy transaction", () => {
            const reader = StreamReader.fromHex("0100000001d39e93d7450e595834e912df0d1c20bae0aa5514\
c26a4c9f8bb51aff41e7a4ae000000006b483045022100ebb7ff7440eaba06fba5876c869822b06aded5dfb30175065b292\
9048535fe130220490a78b45426cf42886d34125e06d7648b296c2a865d82c3a2ad1e9bdefc8b3401210385c468608229fd\
fa4a14d758de1c3db0c3b9ecef7efe02b5447f71f57abaa116ffffffff020000000000000000536a4c50000099560001b8b\
499cc0741c5d6f5cc3aac7cc4b0643a9ec6f60a71ffadbb821e4b87a265cac36afe808716427cd42c046a62775b5aa5e105\
1f9caf69286560cf2a1f0110a73ccf142111be5904835098f52b05000000001976a914790f0b7165352689de319d013cf18\
16b74bc2b2e88ac00000000"); // prettier-ignore
            const sut = Tx.parse(reader);
            expect(sut.version).to.equal(1);
            expect(sut.locktime.value).to.equal(0);
            // expect(sut.txId.toString()).to.equal("c3f11d1708ac20eff9137d4eadd62dd99d71ce22dc51bc51d4e5b83958d9596d"); // prettier-ignore
            // expect(sut.hash.toString()).to.equal("c3f11d1708ac20eff9137d4eadd62dd99d71ce22dc51bc51d4e5b83958d9596d"); // prettier-ignore
            expect(sut.size).to.equal(284);
            expect(sut.vsize).to.equal(284);
            expect(sut.weight).to.equal(1136);
            expect(sut.inputs.length).to.equal(1);

            expect(sut.inputs[0].prevTxId.toString()).to.equal("aea4e741ff1ab58b9f4c6ac21455aae0ba201c0ddf12e93458590e45d7939ed3"); // prettier-ignore
            expect(sut.inputs[0].prevTxIndex).to.equal(0);
            expect(sut.inputs[0].scriptSig.toString()).to.equal("3045022100ebb7ff7440eaba06fba5876c\
869822b06aded5dfb30175065b2929048535fe130220490a78b45426cf42886d34125e06d7648b296c2a865d82c3a2ad1e9\
bdefc8b3401 0385c468608229fdfa4a14d758de1c3db0c3b9ecef7efe02b5447f71f57abaa116"); // prettier-ignore
            expect(sut.inputs[0].sequence.toString()).to.equal("0xffffffff");

            expect(sut.outputs.length).to.equal(2);
            expect(sut.outputs[0].amount).to.equal(BigInt(0));
            expect(sut.outputs[0].scriptPubKey.toString()).to.equal("OP_RETURN 000099560001b8b499cc\
0741c5d6f5cc3aac7cc4b0643a9ec6f60a71ffadbb821e4b87a265cac36afe808716427cd42c046a62775b5aa5e1051f9ca\
f69286560cf2a1f0110a73ccf142111be59048350"); // prettier-ignore

            expect(sut.outputs[1].amount).to.equal(BigInt(86767000));
            expect(sut.outputs[1].scriptPubKey.toString()).to.equal("OP_DUP OP_HASH160 790f0b716535\
2689de319d013cf1816b74bc2b2e OP_EQUALVERIFY OP_CHECKSIG"); // prettier-ignore
        });

        it("parses segwit transaction", () => {
            const reader = StreamReader.fromHex("020000000001018886e5888fd709eb2400ec13db8e310fce7b\
15dce37fd57d08507f6d04d4319601000000171600140c3928c9f33355eacd8b4b5fabc542543f399702feffffff02abac2\
70000000000160014bbf06c4ac80e0bc66f675fc680444ccc8b1552070403679d0100000016001466b90139c95161d9563d\
db6ffc0d3df8247bf5f202473044022079ffca5511b1a2cc59cb3a808cf85cfdd59a461ff511a4c3305dd6a91c165a1e022\
0127a85dc4b312c1df29422e1172c79f6a5ced5fde6d1dca52145ab10b06f841e01210381c5b7881a0b396985786275cd5b\
6816c216d204b2b696421d5e685d399c5d803be01c00"); // prettier-ignore
            const sut = Tx.parse(reader);
            expect(sut.version).to.equal(2);
            expect(sut.locktime.value).to.equal(1892411);
            // expect(sut.txId.toString()).to.equal("aab7beb533f774ed304ceadaea6c53ed706035f61d82e16fcd1b5e85be315b56"); // prettier-ignore
            // expect(sut.hash.toString()).to.equal("8c6b20b7d0b07a6f88721a6ceb21286c55709f110bf41d686a59eb508bb4d33c"); // prettier-ignore
            expect(sut.size).to.equal(245);
            expect(sut.vsize).to.equal(164);
            expect(sut.weight).to.equal(653);

            expect(sut.inputs.length).to.equal(1);
            expect(sut.inputs[0].prevTxId.toString()).to.equal("9631d4046d7f50087dd57fe3dc157bce0f318edb13ec0024eb09d78f88e58688"); // prettier-ignore
            expect(sut.inputs[0].prevTxIndex).to.equal(1);
            expect(sut.inputs[0].scriptSig.toString()).to.equal("00140c3928c9f33355eacd8b4b5fabc542543f399702"); // prettier-ignore
            expect(sut.inputs[0].sequence.toString()).to.equal("0xfffffffe");

            expect(sut.outputs.length).to.equal(2);
            expect(sut.outputs[0].amount).to.equal(BigInt(2600107));
            expect(sut.outputs[0].scriptPubKey.toString()).to.equal("OP_FALSE bbf06c4ac80e0bc66f675fc680444ccc8b155207"); // prettier-ignore

            expect(sut.outputs[1].amount).to.equal(BigInt(6935741188));
            expect(sut.outputs[1].scriptPubKey.toString()).to.equal("OP_FALSE 66b90139c95161d9563ddb6ffc0d3df8247bf5f2"); // prettier-ignore
        });
    });
});
