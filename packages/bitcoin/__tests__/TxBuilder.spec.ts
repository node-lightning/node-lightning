import { getPublicKey, hash160 } from "@node-lightning/crypto";
import { expect } from "chai";
import { OpCode } from "../lib/OpCodes";
import { OutPoint } from "../lib/OutPoint";
import { Script } from "../lib/Script";
import { TxBuilder } from "../lib/TxBuilder";
import { Value } from "../lib/Value";

describe("TxBuilder", () => {
    // address: mufrrGX5ei1g2GBjKBBYvidioNqN7GWJsD
    // pkh:     9b40f5b05efd99e4b0c4f62ca63eec3e580e95c7
    // wif:     cSV9NvF6Gk3gTXgrpfPrjkHCyb4CLQZD3nsQSYUKGH4PPsRS8J2M
    const privA = Buffer.from("92541d4cdb6f0db05949e4fd91d7cb936f84eb21a62b477103d0e1957e6ad782", "hex"); // prettier-ignore
    const pubkeyA = getPublicKey(privA, true);
    const pubkeyHashA = hash160(pubkeyA);

    // address: myVmRHXHq6qzW7s7TCseBLLgajKxT6Z19j
    // pkh:     c538c517797dfefdf30142dc1684bfd947532dbb
    // wif:     cSAyZjTwLx2eh76MfL5zmGV8n7pk61Lx5We2S95UGyhiwoSgJgv2
    const privB = Buffer.from("88fb4d47adfd310bf071d67c8ac569f58d8e4c4d8d94b778c010ddd0e2ff6a48", "hex"); // prettier-ignore
    const pubkeyB = getPublicKey(privB, true);
    const pubkeyHashB = hash160(pubkeyB);

    describe(".sign()", () => {
        it("p2pkh", () => {
            const sut = new TxBuilder();
            sut.version = 2;
            sut.addInput(OutPoint.fromString("9d0e63ad73020a9fad0106b6727e31d36e3ab4b9a01451233926d4759569de68:0")); // prettier-ignore
            sut.addOutput(Value.fromBitcoin(49.9999), Script.p2pkhLock(pubkeyHashB)); // prettier-ignore

            const scriptSig = Script.p2pkhLock(pubkeyHashA);
            const sig = sut.sign(privA, 0, scriptSig);
            expect(sig.toString("hex")).to.equal(
                "30450221009fdc678141bfad627023ae38336716543f91c1b12462673bc9d4fddd6cba5f3c02202e8dd9c9ce538c6bc9b29612ccbf07b3051c13e0f40e92ce3e663060da4c803a01",
            );
        });

        it("p2pk", () => {
            const sut = new TxBuilder();
            sut.version = 2;
            sut.addInput(OutPoint.fromString("68ce1030a63bd7ff44a95f497d3535731cfa3e6b89eda5ce38eb37a6d527d0dc:0")); // prettier-ignore
            sut.addOutput(Value.fromBitcoin(49.9998), Script.p2pkLock(pubkeyB));

            const commitScript = Script.p2pkLock(pubkeyA);
            const sig = sut.sign(privA, 0, commitScript);
            expect(sig.toString("hex")).to.equal(
                "3045022100d87f7a819cb6ff3140c5ab0f20def422ae1eaa8aade78c33c2368b6be2609d2b022049581379f827bb08f088591d40f7890526aa17403d3e77d2af411774338de7ce01",
            );
        });
    });

    describe(".serialize()", () => {
        it("spend p2pkh to p2pkh output", () => {
            const sut = new TxBuilder();
            sut.version = 2;
            sut.addInput(OutPoint.fromString("9d0e63ad73020a9fad0106b6727e31d36e3ab4b9a01451233926d4759569de68:0")); // prettier-ignore
            sut.addOutput(Value.fromBitcoin(49.9999), Script.p2pkhLock(pubkeyHashB)); // prettier-ignore

            const commitScript = Script.p2pkhLock(pubkeyHashA);
            const sig = sut.sign(privA, 0, commitScript);
            sut.inputs[0].scriptSig = Script.p2pkhUnlock(sig, pubkeyA);

            expect(sut.serialize().toString("hex")).to.equal(
                "020000000168de699575d42639235114a0b9b43a6ed3317e72b60601ad9f0a0273ad630e9d000000006b4830450221009fdc678141bfad627023ae38336716543f91c1b12462673bc9d4fddd6cba5f3c02202e8dd9c9ce538c6bc9b29612ccbf07b3051c13e0f40e92ce3e663060da4c803a012102c13bf903d6147a7fec59b450e2e8a6c174c35a11a7675570d10bd05bc3597996ffffffff01f0ca052a010000001976a914c538c517797dfefdf30142dc1684bfd947532dbb88acffffffff",
            );
        });

        it("spend p2pk to p2pk output", () => {
            const sut = new TxBuilder();
            sut.version = 2;
            sut.addInput(OutPoint.fromString("68ce1030a63bd7ff44a95f497d3535731cfa3e6b89eda5ce38eb37a6d527d0dc:0")); // prettier-ignore
            sut.addOutput(Value.fromBitcoin(49.9998), Script.p2pkLock(pubkeyB));

            const commitScript = Script.p2pkLock(pubkeyA);
            const sig = sut.sign(privA, 0, commitScript);
            sut.inputs[0].scriptSig = Script.p2pkUnlock(sig);

            expect(sut.serialize().toString("hex")).to.equal(
                "0200000001dcd027d5a637eb38cea5ed896b3efa1c7335357d495fa944ffd73ba63010ce680000000049483045022100d87f7a819cb6ff3140c5ab0f20def422ae1eaa8aade78c33c2368b6be2609d2b022049581379f827bb08f088591d40f7890526aa17403d3e77d2af411774338de7ce01ffffffff01e0a3052a0100000023210334acee9adf0e3e490a422dfe98bc10a8091b43047b793b8d840657b6b6a46c56acffffffff",
            );
        });

        it("spend p2pkh to p2sh-p2pkh output", () => {
            const sut = new TxBuilder();
            sut.version = 2;
            sut.addInput(
                OutPoint.fromString(
                    "ca5bbd3eec382f2148d8a3f0abe92ee0156bb3657ca9400eecb0812aa2f6f0d9:0",
                ),
            );
            sut.addOutput(
                Value.fromBitcoin(49.9999),
                Script.p2shLock(Script.p2pkhLock(pubkeyHashA).hash160()),
            );

            const commitScript = Script.p2pkhLock(pubkeyHashA);
            const sig = sut.sign(privA, 0, commitScript);
            sut.inputs[0].scriptSig = Script.p2pkhUnlock(sig, pubkeyA);

            expect(sut.serialize().toString("hex")).to.equal(
                "0200000001d9f0f6a22a81b0ec0e40a97c65b36b15e02ee9abf0a3d848212f38ec3ebd5bca000000006a47304402205b1d47b4f0db4fe99b035a87649fbdfc3867e10950d5412b2875cd3774a052c2022037e3c70bfa8e237ed409e409bf6c8b0aa574e44297ed4fc868264ce5148d437a012102c13bf903d6147a7fec59b450e2e8a6c174c35a11a7675570d10bd05bc3597996ffffffff01f0ca052a0100000017a914a7b6b1cc86e6d0b8876040a46da5a346b8662db487ffffffff",
            );
        });

        it("spend p2pkh to p2ms", () => {
            const sut = new TxBuilder();
            sut.version = 2;
            sut.addInput(
                OutPoint.fromString(
                    "997fd2dd17a5d5843edc23ab7f043130dfe737cf0e02336c75fe37c1eda51195:0",
                ),
            );
            sut.addOutput(
                Value.fromBitcoin(49.9999),
                new Script(OpCode.OP_2, pubkeyA, pubkeyB, OpCode.OP_2, OpCode.OP_CHECKMULTISIG),
            );

            const commitScript = Script.p2pkhLock(pubkeyHashA);
            const sig = sut.sign(privA, 0, commitScript);
            sut.inputs[0].scriptSig = Script.p2pkhUnlock(sig, pubkeyA);

            expect(sut.serialize().toString("hex")).to.equal(
                "02000000019511a5edc137fe756c33020ecf37e7df3031047fab23dc3e84d5a517ddd27f99000000006b483045022100eca82b19d1954f6f24292b12dfc49379b536c65c32871309a81ec220750a07bd02205fdff7a71a4727e2fb17b7f089037054a5e6ef30c3ce12796c661ec690292443012102c13bf903d6147a7fec59b450e2e8a6c174c35a11a7675570d10bd05bc3597996ffffffff01f0ca052a0100000047522102c13bf903d6147a7fec59b450e2e8a6c174c35a11a7675570d10bd05bc3597996210334acee9adf0e3e490a422dfe98bc10a8091b43047b793b8d840657b6b6a46c5652aeffffffff",
            );
        });

        it("spend p2ms to p2pkh", () => {
            const sut = new TxBuilder();
            sut.version = 2;
            sut.addInput(
                OutPoint.fromString(
                    "d6422b4b4c9ec2e8f5f6eaff948241c494397f7e6ca4a2ca2783e3ea3581e27f:0",
                ),
            );
            sut.addOutput(Value.fromBitcoin(49.9998), Script.p2pkhLock(pubkeyHashB));

            const commitScript = new Script(
                OpCode.OP_2,
                pubkeyA,
                pubkeyB,
                OpCode.OP_2,
                OpCode.OP_CHECKMULTISIG,
            );
            const sigA = sut.sign(privA, 0, commitScript);
            const sigB = sut.sign(privB, 0, commitScript);
            const scriptSig = new Script(OpCode.OP_0, sigA, sigB);
            sut.inputs[0].scriptSig = scriptSig;

            expect(sut.serialize().toString("hex")).to.equal(
                "02000000017fe28135eae38327caa2a46c7e7f3994c4418294ffeaf6f5e8c29e4c4b2b42d6000000009300483045022100d13069b4f0405313c34e42732b66e8633dea520cb39681f53872ba764d91694e02202b18904588344521a38f89fe2ca9273e3e0136a1bf96893f5ae6f50a5f6c4a1001483045022100e453e80486b0788c85b88c9be65740dcdb1de3c92781c828ccfa30f751bf5d75022056a890efe7b061f2986e2e542996f41324a180de80d03b947c009cb5cd1dd0d301ffffffff01e0a3052a010000001976a914c538c517797dfefdf30142dc1684bfd947532dbb88acffffffff",
            );
        });

        it("spend p2sh-p2pkh to p2sh output", () => {
            const sut = new TxBuilder();
            sut.version = 2;
            sut.addInput(
                OutPoint.fromString(
                    "33e5bb0c1640b1be2a2f2e287c14be86f36cdc831fde0fd953b3a1ab9cb2c8d9:0",
                ),
            );
            sut.addOutput(
                Value.fromBitcoin(49.9998),
                Script.p2shLock(
                    new Script(OpCode.OP_7, OpCode.OP_ADD, OpCode.OP_10, OpCode.OP_EQUAL).hash160(),
                ),
            );

            const commitScript = Script.p2pkhLock(pubkeyHashA);
            const sig = sut.sign(privA, 0, commitScript);
            sut.inputs[0].scriptSig = new Script(sig, pubkeyA, commitScript.serializeCmds());

            expect(sut.serialize().toString("hex")).to.equal(
                "0200000001d9c8b29caba1b353d90fde1f83dc6cf386be147c282e2f2abeb140160cbbe533000000008447304402206cada8b4b6caeadf293627f841244f730aaed74f53709982fd24776643a658d8022026614f756642e08c08b20546f894396187ec1a4ea709a1c69cd036b3ac2f6441012102c13bf903d6147a7fec59b450e2e8a6c174c35a11a7675570d10bd05bc35979961976a9149b40f5b05efd99e4b0c4f62ca63eec3e580e95c788acffffffff01e0a3052a0100000017a9141fec31deece63a911dd9b22fa974ba9760d1bc3d87ffffffff",
            );
        });

        it("spend p2sh to p2sh output", () => {
            const sut = new TxBuilder();
            sut.version = 2;
            sut.addInput(
                OutPoint.fromString(
                    "a76bb71e2739080f34989c92e1bca2ffe83a9c0d9e424cafe649860cfe11c16c:0",
                ),
            );

            sut.addOutput(
                Value.fromBitcoin(49.9997),
                Script.p2shLock(
                    new Script(OpCode.OP_7, OpCode.OP_ADD, OpCode.OP_12, OpCode.OP_EQUAL).hash160(),
                ),
            );

            const commitScript = new Script(
                OpCode.OP_7,
                OpCode.OP_ADD,
                OpCode.OP_10,
                OpCode.OP_EQUAL,
            );
            sut.inputs[0].scriptSig = new Script(OpCode.OP_3, commitScript.serializeCmds());

            expect(sut.serialize().toString("hex")).to.equal(
                "02000000016cc111fe0c8649e6af4c429e0d9c3ae8ffa2bce1929c98340f0839271eb76ba70000000006530457935a87ffffffff01d07c052a0100000017a9149a21dbd362501cd7b7790f1c696c55563a8b602c87ffffffff",
            );
        });

        it("spends p2pkh to p2sh-p2ms", () => {
            const sut = new TxBuilder();
            sut.version = 2;
            sut.addInput(
                OutPoint.fromString(
                    "0382e83cc4692fbd554d621c214263a3414ec0cbbdef0fee73b16992613b8809:0",
                ),
            );
            sut.addOutput(
                Value.fromBitcoin(49.9999),
                Script.p2shLock(
                    new Script(
                        OpCode.OP_2,
                        pubkeyA,
                        pubkeyB,
                        OpCode.OP_2,
                        OpCode.OP_CHECKMULTISIG,
                    ).hash160(),
                ),
            );

            const commitScript = Script.p2pkhLock(pubkeyHashA);
            const sig = sut.sign(privA, 0, commitScript);
            sut.inputs[0].scriptSig = Script.p2pkhUnlock(sig, pubkeyA);

            expect(sut.serialize().toString("hex")).to.equal(
                "020000000109883b619269b173ee0fefbdcbc04e41a36342211c624d55bd2f69c43ce88203000000006b483045022100b5e8805ca04c0c360fad14768792aaeb80b1be3480e3d69b830ae4903dbc731d02206a4ca0e5e650b709ad94bfb8762bd81d4b31192417d1f9d1956b3b27bce616c6012102c13bf903d6147a7fec59b450e2e8a6c174c35a11a7675570d10bd05bc3597996ffffffff01f0ca052a0100000017a914c5421130046c411fc4616d54d6ba0412328c32cf87ffffffff",
            );
        });

        it("spends p2sh-p2ms to p2pkh", () => {
            const sut = new TxBuilder();
            sut.version = 2;
            sut.addInput(
                OutPoint.fromString(
                    "26aec57587f3e093f8236706873e3c71f95c18310b688925e657ef9b9ce0309d:0",
                ),
            );
            sut.addOutput(Value.fromBitcoin(49.9998), Script.p2pkhLock(pubkeyHashB));

            const commitScript = new Script(
                OpCode.OP_2,
                pubkeyA,
                pubkeyB,
                OpCode.OP_2,
                OpCode.OP_CHECKMULTISIG,
            );
            const sigA = sut.sign(privA, 0, commitScript);
            const sigB = sut.sign(privB, 0, commitScript);
            sut.inputs[0].scriptSig = new Script(
                OpCode.OP_0,
                sigA,
                sigB,
                commitScript.serializeCmds(),
            );

            expect(sut.serialize().toString("hex")).to.equal(
                "02000000019d30e09c9bef57e62589680b31185cf9713c3e87066723f893e0f38775c5ae2600000000da004830450221008870bcd4ec57b2dbca90b6c3271829f1c2cd519bfd9d3c32e20bfc1d4b3e8419022006ad98bf13ce78636d159587e41683e6053231740b99ac9ec72e7f3201c5a26301473044022045b5beb5060ae43d873b8becda7c62c53968619d49e23a5094705f2e50156c6802206e6f40b795348d756c176c15fbbe61b0ddcb2eecb51623c5f89618ffccca90fc0147522102c13bf903d6147a7fec59b450e2e8a6c174c35a11a7675570d10bd05bc3597996210334acee9adf0e3e490a422dfe98bc10a8091b43047b793b8d840657b6b6a46c5652aeffffffff01e0a3052a010000001976a914c538c517797dfefdf30142dc1684bfd947532dbb88acffffffff",
            );
        });
    });
});
