import { StreamReader } from "@node-lightning/bufio";
import { expect } from "chai";
import { HashByteOrder } from "../lib/HashByteOrder";
import { Tx } from "../lib/Tx";

describe("Tx", () => {
    describe("#.decode()", () => {
        const tests: Array<[string, string, any]> = [
            [
                "legacy transaction",
                "0100000001d39e93d7450e595834e912df0d1c20bae0aa5514\
c26a4c9f8bb51aff41e7a4ae000000006b483045022100ebb7ff7440eaba06fba5876c869822b06aded5dfb30175065b292\
9048535fe130220490a78b45426cf42886d34125e06d7648b296c2a865d82c3a2ad1e9bdefc8b3401210385c468608229fd\
fa4a14d758de1c3db0c3b9ecef7efe02b5447f71f57abaa116ffffffff020000000000000000536a4c50000099560001b8b\
499cc0741c5d6f5cc3aac7cc4b0643a9ec6f60a71ffadbb821e4b87a265cac36afe808716427cd42c046a62775b5aa5e105\
1f9caf69286560cf2a1f0110a73ccf142111be5904835098f52b05000000001976a914790f0b7165352689de319d013cf18\
16b74bc2b2e88ac00000000",
                {
                    txid: "c3f11d1708ac20eff9137d4eadd62dd99d71ce22dc51bc51d4e5b83958d9596d",
                    hash: "c3f11d1708ac20eff9137d4eadd62dd99d71ce22dc51bc51d4e5b83958d9596d",
                    version: 1,
                    size: 284,
                    vsize: 284,
                    weight: 1136,
                    vin: [
                        {
                            txid:
                                "aea4e741ff1ab58b9f4c6ac21455aae0ba201c0ddf12e93458590e45d7939ed3",
                            vout: 0,
                            scriptSig: {
                                asm:
                                    "3045022100ebb7ff7440eaba06fba5876c869822b06aded5dfb30175065b2929048535fe130220490a78b45426cf42886d34125e06d7648b296c2a865d82c3a2ad1e9bdefc8b3401 0385c468608229fdfa4a14d758de1c3db0c3b9ecef7efe02b5447f71f57abaa116",
                            },
                            sequence: 4294967295,
                        },
                    ],
                    vout: [
                        {
                            value: 0,
                            scriptPubKey: {
                                asm:
                                    "OP_RETURN 000099560001b8b499cc0741c5d6f5cc3aac7cc4b0643a9ec6f60a71ffadbb821e4b87a265cac36afe808716427cd42c046a62775b5aa5e1051f9caf69286560cf2a1f0110a73ccf142111be59048350",
                            },
                        },
                        {
                            value: 0.86767,
                            scriptPubKey: {
                                asm:
                                    "OP_DUP OP_HASH160 790f0b7165352689de319d013cf1816b74bc2b2e OP_EQUALVERIFY OP_CHECKSIG",
                            },
                        },
                    ],
                    locktime: 0,
                },
            ],
            [
                "legacy transaction",
                "0100000001055794064fa88dec7d18b40eef7344dc36b9f45130d51a299341ae571bca56e4010000006a47304402204ea3dd49155908c537fb25b8c4107bb7c358233e347f43aa0eeb6db3f23efcdc02207509e90de86097b39125529e7ea715c4caf7f642d9f3312e04a478867b14250a01210377ddc2de5af3f3f2b8f45cf89ee9e1089cecf01a1d492b3ef6107269c5537506ffffffff029d60dc01000000001976a91463979b23ad714e3bac76ea7f23481ea74f225ebf88ac80110a00000000001976a9146454923514a78f310f3cde44cdf025058c47f35088ac00000000",
                {
                    txid: "73c81fc5ad1c9991fbc804967a153e1f8f8e9380c206cdf35c0dc7e20393df22",
                    hash: "73c81fc5ad1c9991fbc804967a153e1f8f8e9380c206cdf35c0dc7e20393df22",
                    version: 1,
                    size: 225,
                    vsize: 225,
                    weight: 900,
                    locktime: 0,
                    vin: [
                        {
                            txid:
                                "e456ca1b57ae4193291ad53051f4b936dc4473ef0eb4187dec8da84f06945705",
                            vout: 1,
                            scriptSig: {
                                asm:
                                    "304402204ea3dd49155908c537fb25b8c4107bb7c358233e347f43aa0eeb6db3f23efcdc02207509e90de86097b39125529e7ea715c4caf7f642d9f3312e04a478867b14250a01 0377ddc2de5af3f3f2b8f45cf89ee9e1089cecf01a1d492b3ef6107269c5537506",
                                hex:
                                    "47304402204ea3dd49155908c537fb25b8c4107bb7c358233e347f43aa0eeb6db3f23efcdc02207509e90de86097b39125529e7ea715c4caf7f642d9f3312e04a478867b14250a01210377ddc2de5af3f3f2b8f45cf89ee9e1089cecf01a1d492b3ef6107269c5537506",
                            },
                            txinwitness: undefined,
                            sequence: 4294967295,
                        },
                    ],
                    vout: [
                        {
                            value: 0.31219869,
                            n: 0,
                            scriptPubKey: {
                                asm:
                                    "OP_DUP OP_HASH160 63979b23ad714e3bac76ea7f23481ea74f225ebf OP_EQUALVERIFY OP_CHECKSIG",
                                hex: "76a91463979b23ad714e3bac76ea7f23481ea74f225ebf88ac",
                                reqSigs: 1,
                                type: "pubkeyhash",
                                addresses: ["1A5bWmBGoBovJD6bvKhxp37LLUq1ixuZnD"],
                            },
                        },
                        {
                            value: 0.0065984,
                            n: 1,
                            scriptPubKey: {
                                asm:
                                    "OP_DUP OP_HASH160 6454923514a78f310f3cde44cdf025058c47f350 OP_EQUALVERIFY OP_CHECKSIG",
                                hex: "76a9146454923514a78f310f3cde44cdf025058c47f35088ac",
                                reqSigs: 1,
                                type: "pubkeyhash",
                                addresses: ["1A9VtHgdv5HsSwfWvrbs67MdMUnCKeQppS"],
                            },
                        },
                    ],
                },
            ],
            [
                "base transaction with no inputs",
                "02000000000100e1f5050000000017a9148fe46e05e329badba1c390a5ea2c0ad7de2059cd8700000000",
                {
                    txid: "91dfa1f99ac88ddcad2bd0d182c6ceb75436c7e42f7639b6343ec64dcbf15ee9",
                    hash: "91dfa1f99ac88ddcad2bd0d182c6ceb75436c7e42f7639b6343ec64dcbf15ee9",
                    version: 2,
                    size: 42,
                    vsize: 42,
                    weight: 168,
                    locktime: 0,
                    vin: [],
                    vout: [
                        {
                            value: 1.0,
                            n: 0,
                            scriptPubKey: {
                                asm: "OP_HASH160 8fe46e05e329badba1c390a5ea2c0ad7de2059cd OP_EQUAL",
                                hex: "a9148fe46e05e329badba1c390a5ea2c0ad7de2059cd87",
                                reqSigs: 1,
                                type: "scripthash",
                                addresses: ["2N6N4GJ4E5fSZ7vGPTQ6qP1ZbYcZSXdzaPs"],
                            },
                        },
                    ],
                },
            ],
            [
                "segwit transaction",
                "020000000001018886e5888fd709eb2400ec13db8e310fce7b\
15dce37fd57d08507f6d04d4319601000000171600140c3928c9f33355eacd8b4b5fabc542543f399702feffffff02abac2\
70000000000160014bbf06c4ac80e0bc66f675fc680444ccc8b1552070403679d0100000016001466b90139c95161d9563d\
db6ffc0d3df8247bf5f202473044022079ffca5511b1a2cc59cb3a808cf85cfdd59a461ff511a4c3305dd6a91c165a1e022\
0127a85dc4b312c1df29422e1172c79f6a5ced5fde6d1dca52145ab10b06f841e01210381c5b7881a0b396985786275cd5b\
6816c216d204b2b696421d5e685d399c5d803be01c00",
                {
                    txid: "aab7beb533f774ed304ceadaea6c53ed706035f61d82e16fcd1b5e85be315b56",
                    hash: "8c6b20b7d0b07a6f88721a6ceb21286c55709f110bf41d686a59eb508bb4d33c",
                    version: 2,
                    size: 245,
                    vsize: 164,
                    weight: 653,
                    locktime: 1892411,
                    vin: [
                        {
                            txid:
                                "9631d4046d7f50087dd57fe3dc157bce0f318edb13ec0024eb09d78f88e58688",
                            vout: 1,
                            scriptSig: {
                                asm: "00140c3928c9f33355eacd8b4b5fabc542543f399702",
                            },
                            txinwitness: [
                                "3044022079ffca5511b1a2cc59cb3a808cf85cfdd59a461ff511a4c3305dd6a91c165a1e0220127a85dc4b312c1df29422e1172c79f6a5ced5fde6d1dca52145ab10b06f841e01",
                                "0381c5b7881a0b396985786275cd5b6816c216d204b2b696421d5e685d399c5d80",
                            ],
                            sequence: 4294967294,
                        },
                    ],
                    vout: [
                        {
                            value: 0.02600107,
                            scriptPubKey: {
                                asm: "OP_FALSE bbf06c4ac80e0bc66f675fc680444ccc8b155207",
                            },
                        },
                        {
                            value: 69.35741188,
                            scriptPubKey: {
                                asm: "OP_FALSE 66b90139c95161d9563ddb6ffc0d3df8247bf5f2",
                            },
                        },
                    ],
                },
            ],
            [
                "segwit transactin",
                "01000000000101a4ed39cb5739489cf4afedbfb1673b57738e058a4c4d408ee13e7872949636a40300000000ffffffff02401f7d000000000017a9141119f6b582351101527fe603126a997575ad6650870fe60c0500000000220020701a8d401c84fb13e6baf169d59684e17abd9fa216c8cc5b9fc63d622ff8c58d0400483045022100995abff56d806f0a4fadd9977f3ea7c16e9695f2938a15dcaf1febfcfff0aba302201ef1010a259d263121d5283db45a12898f212aac96b5a0ecef81c876ea561a5d01483045022100894cd4860dffaf3f6b411157013bbf6b436d32dd63febe5146d47cb84f7f45d302201cf84f40634f898b21159bd0a71013280e21f41da65de036007f37dd6987a0f6016952210375e00eb72e29da82b89367947f29ef34afb75e8654f6ea368e0acdfd92976b7c2103a1b26313f430c4b15bb1fdce663207659d8cac749a0e53d70eff01874496feff2103c96d495bfdd5ba4145e3e046fee45e84a8a48ad05bd8dbb395c011a32cf9f88053ae00000000",
                {
                    txid: "839f9c829d4afa456ef98acdd1a4f46bb23298a488db3b261d8c94efa9525fd3",
                    hash: "24fe13a9a8166c1c87416b366c6d1751c893059fc2f825fee5c7b1eca7120d49",
                    version: 1,
                    size: 382,
                    vsize: 190,
                    weight: 760,
                    locktime: 0,
                    vin: [
                        {
                            txid:
                                "a436969472783ee18e404d4c8a058e73573b67b1bfedaff49c483957cb39eda4",
                            vout: 3,
                            scriptSig: {
                                asm: "",
                                hex: "",
                            },
                            txinwitness: [
                                "",
                                "3045022100995abff56d806f0a4fadd9977f3ea7c16e9695f2938a15dcaf1febfcfff0aba302201ef1010a259d263121d5283db45a12898f212aac96b5a0ecef81c876ea561a5d01",
                                "3045022100894cd4860dffaf3f6b411157013bbf6b436d32dd63febe5146d47cb84f7f45d302201cf84f40634f898b21159bd0a71013280e21f41da65de036007f37dd6987a0f601",
                                "52210375e00eb72e29da82b89367947f29ef34afb75e8654f6ea368e0acdfd92976b7c2103a1b26313f430c4b15bb1fdce663207659d8cac749a0e53d70eff01874496feff2103c96d495bfdd5ba4145e3e046fee45e84a8a48ad05bd8dbb395c011a32cf9f88053ae",
                            ],
                            sequence: 4294967295,
                        },
                    ],
                    vout: [
                        {
                            value: 0.082,
                            n: 0,
                            scriptPubKey: {
                                asm: "OP_HASH160 1119f6b582351101527fe603126a997575ad6650 OP_EQUAL",
                                hex: "a9141119f6b582351101527fe603126a997575ad665087",
                                reqSigs: 1,
                                type: "scripthash",
                                addresses: ["33FSWo4Be2WtP2i5wkdPTTYPH6NzgHnJqQ"],
                            },
                        },
                        {
                            value: 0.84731407,
                            n: 1,
                            scriptPubKey: {
                                asm:
                                    "OP_FALSE 701a8d401c84fb13e6baf169d59684e17abd9fa216c8cc5b9fc63d622ff8c58d",
                                hex:
                                    "0020701a8d401c84fb13e6baf169d59684e17abd9fa216c8cc5b9fc63d622ff8c58d",
                                reqSigs: 1,
                                type: "witness_v0_scripthash",
                                addresses: [
                                    "bc1qwqdg6squsna38e46795at95yu9atm8azzmyvckulcc7kytlcckxswvvzej",
                                ],
                            },
                        },
                    ],
                },
            ],
        ];

        for (const [title, input, expected] of tests) {
            it(title, () => {
                const result = Tx.decode(StreamReader.fromHex(input));
                expect(result.version).to.equal(expected.version);
                expect(result.txId.toString()).to.equal(expected.txid);
                expect(result.witnessTxId.toString()).to.equal(expected.hash);
                expect(result.size).to.equal(expected.size);
                expect(result.vsize).to.equal(expected.vsize);
                expect(result.weight).to.equal(expected.weight);
                expect(result.inputs.length).to.equal(expected.vin.length);
                for (let i = 0; i < result.inputs.length; i++) {
                    const vin = result.inputs[i];
                    expect(vin.outpoint.txid.toString(HashByteOrder.RPC)).to.equal(expected.vin[i].txid); // prettier-ignore
                    expect(vin.outpoint.outputIndex).to.equal(expected.vin[i].vout);
                    expect(vin.scriptSig.toString()).to.equal(expected.vin[i].scriptSig.asm);
                    expect(vin.sequence.value).to.equal(expected.vin[i].sequence);
                    if (expected.vin[i].txinwitness) {
                        expect(vin.witness.length).to.equal(expected.vin[i].txinwitness.length);
                        for (let w = 0; w < vin.witness.length; w++) {
                            expect(vin.witness[w].toString()).to.equal(
                                expected.vin[i].txinwitness[w],
                            );
                        }
                    }
                }
                expect(result.outputs.length).to.equal(expected.vout.length);
                for (let i = 0; i < result.outputs.length; i++) {
                    const vout = result.outputs[i];
                    expect(Number(vout.value.bitcoin)).to.equal(expected.vout[i].value);
                    expect(vout.scriptPubKey.toString()).to.equal(
                        expected.vout[i].scriptPubKey.asm,
                    );
                }
                expect(result.locktime.value).to.equal(expected.locktime);
            });
        }
    });

    describe(".toHex()", () => {
        it("pretty", () => {
            const sut = Tx.decode(StreamReader.fromHex("020000000001018154ecccf11a5fb56c39654c4deb4d2296f83c69268280b94d021370c94e219700000000000000000001e8030000000000002200204adb4e2f00643db396dd120d4e7dc17625f5f2c11a40d857accc862d6b7dd80e050047304402206a6e59f18764a5bf8d4fa45eebc591566689441229c918b480fb2af8cc6a4aeb02205248f273be447684b33e3c8d1d85a8e0ca9fa0bae9ae33f0527ada9c162919a60147304402207cb324fa0de88f452ffa9389678127ebcf4cabe1dd848b8e076c1a1962bf34720220116ed922b12311bd602d67e60d2529917f21c5b82f25ff6506c0f87886b4dfd5012000000000000000000000000000000000000000000000000000000000000000008a76a91414011f7254d96b819c76986c277d115efce6f7b58763ac67210394854aa6eab5b2a8122cc726e9dded053a2184d88256816826d6231c068d4a5b7c8201208763a914b8bcb07f6344b42ab04250c86a6e8b75d3fdbbc688527c21030d417a46946384f88d5f3337267c5e579765875dc4daca813e21734b140639e752ae677502f401b175ac686800000000")); // prettier-ignore
            expect(sut.toHex(true)).to.equal(`02000000
0001
01
    8154ecccf11a5fb56c39654c4deb4d2296f83c69268280b94d021370c94e2197
    00000000
    00
    00000000
01
    e803000000000000
    2200204adb4e2f00643db396dd120d4e7dc17625f5f2c11a40d857accc862d6b7dd80e
05
    00
    47304402206a6e59f18764a5bf8d4fa45eebc591566689441229c918b480fb2af8cc6a4aeb02205248f273be447684b33e3c8d1d85a8e0ca9fa0bae9ae33f0527ada9c162919a601
    47304402207cb324fa0de88f452ffa9389678127ebcf4cabe1dd848b8e076c1a1962bf34720220116ed922b12311bd602d67e60d2529917f21c5b82f25ff6506c0f87886b4dfd501
    200000000000000000000000000000000000000000000000000000000000000000
    8a76a91414011f7254d96b819c76986c277d115efce6f7b58763ac67210394854aa6eab5b2a8122cc726e9dded053a2184d88256816826d6231c068d4a5b7c8201208763a914b8bcb07f6344b42ab04250c86a6e8b75d3fdbbc688527c21030d417a46946384f88d5f3337267c5e579765875dc4daca813e21734b140639e752ae677502f401b175ac6868
00000000`);
        });
        describe("pretty", () => {
            it("");
        });
    });
});
