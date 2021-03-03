import { StreamReader } from "@node-lightning/bufio";
import { getPublicKey, hash160 } from "@node-lightning/crypto";
import { expect } from "chai";
import { LockTime } from "../lib/LockTime";
import { OpCode } from "../lib/OpCodes";
import { Script } from "../lib/Script";
import { Sequence } from "../lib/Sequence";
import { Stack } from "../lib/Stack";
import { TxBuilder } from "../lib/TxBuilder";
import { TxIn } from "../lib/TxIn";
import { TxOut } from "../lib/TxOut";
import { Value } from "../lib/Value";
import { Witness } from "../lib/Witness";

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
            sut.addInput("9d0e63ad73020a9fad0106b6727e31d36e3ab4b9a01451233926d4759569de68:0");
            sut.addOutput(49.9999, Script.p2pkhLock(pubkeyHashB)); // prettier-ignore

            const commitScript = Script.p2pkhLock(pubkeyHashA);
            const sig = sut.sign(0, commitScript, privA);
            expect(sig.toString("hex")).to.equal(
                "30450221009fdc678141bfad627023ae38336716543f91c1b12462673bc9d4fddd6cba5f3c02202e8dd9c9ce538c6bc9b29612ccbf07b3051c13e0f40e92ce3e663060da4c803a01",
            );
        });

        it("p2pk", () => {
            const sut = new TxBuilder();
            sut.addInput("68ce1030a63bd7ff44a95f497d3535731cfa3e6b89eda5ce38eb37a6d527d0dc:0"); // prettier-ignore
            sut.addOutput(49.9998, Script.p2pkLock(pubkeyB));

            const commitScript = Script.p2pkLock(pubkeyA);
            const sig = sut.sign(0, commitScript, privA);
            expect(sig.toString("hex")).to.equal(
                "3045022100d87f7a819cb6ff3140c5ab0f20def422ae1eaa8aade78c33c2368b6be2609d2b022049581379f827bb08f088591d40f7890526aa17403d3e77d2af411774338de7ce01",
            );
        });

        it("BIP P2WPKH test vector", () => {
            const priv2 = Buffer.from("619c335025c7f4012e556c2a58b2506e30b8511b53ade95ea316fd8c3286feb9", "hex"); // prettier-ignore
            const pubkey2 = Buffer.from("025476c2e83188368da1ff3e292e7acafcdb3566bb0ad253f62fc70f07aeee6357", "hex"); // prettier-ignore

            const tx = new TxBuilder();
            tx.version = 1;
            tx.addInput(TxIn.fromHex("fff7f7881a8099afa6940d42d1e7f6362bec38171ea3edf433541db4e4ad969f0000000000eeffffff")); // prettier-ignore
            tx.addInput(TxIn.fromHex("ef51e1b804cc89d182d279655c3aa89e815b1b309fe287d9b2b55d57b90ec68a0100000000ffffffff")); // prettier-ignore
            tx.addOutput(TxOut.fromHex("202cb206000000001976a9148280b37df378db99f66f85c95a783a76ac7a6d5988ac")); // prettier-ignore
            tx.addOutput(TxOut.fromHex("9093510d000000001976a9143bde42dbee7e4dbe6a21b2d50ce2f0167faa815988ac")); // prettier-ignore
            tx.locktime = LockTime.parse(StreamReader.fromHex("11000000"));

            const index = 1;
            const commitScript = Script.p2pkhLock(pubkey2);
            const value = Value.fromBitcoin(6);

            const hash = tx.hashSegwitv0(index, commitScript, value);
            expect(hash.toString("hex")).to.equal(
                "c37af31116d1b27caf68aae9e3ac82f1477929014d5b917657d0eb49478cb670",
            );

            const sig = tx.signSegWitv0(index, commitScript, priv2, value);
            expect(sig.toString("hex")).to.equal(
                "304402203609e17b84f6a7d30c80bfa610b5b4542f32a8a0d5447a12fb1366d7f01cc44a0220573a954c4518331561406f90300e8f3358f51928d43c212a8caed02de67eebee01",
            );
        });

        it("BIP143 P2SH-P2WPKH test vector", () => {
            const privkey = Buffer.from("eb696a065ef48a2192da5b28b694f87544b30fae8327c4510137a922f32c6dcf", "hex"); // prettier-ignore
            const pubkey = Buffer.from("03ad1d8e89212f0b92c74d23bb710c00662ad1470198ac48c43f7d6f93a2a26873", "hex"); // prettier-ignore

            const tx = new TxBuilder();
            tx.version = 1;
            tx.addInput(TxIn.fromHex("db6b1b20aa0fd7b23880be2ecbd4a98130974cf4748fb66092ac4d3ceb1a54770100000000feffffff")); // prettier-ignore
            tx.addOutput(TxOut.fromHex("b8b4eb0b000000001976a914a457b684d7f0d539a46a45bbc043f35b59d0d96388ac")); // prettier-ignore
            tx.addOutput(TxOut.fromHex("0008af2f000000001976a914fd270b1ee6abcaea97fea7ad0402e8bd8ad6d77c88ac")); // prettier-ignore
            tx.locktime = LockTime.parse(StreamReader.fromHex("92040000"));

            const index = 0;
            const commitScript = Script.p2pkhLock(pubkey);
            const value = Value.fromBitcoin(10);

            const hash = tx.hashSegwitv0(index, commitScript, value);
            expect(hash.toString("hex")).to.equal(
                "64f3b0f4dd2bb3aa1ce8566d220cc74dda9df97d8490cc81d89d735c92e59fb6",
            );

            const sig = tx.signSegWitv0(index, commitScript, privkey, value);
            expect(sig.toString("hex")).to.equal(
                "3044022047ac8e878352d3ebbde1c94ce3a10d057c24175747116f8288e5d794d12d482f0220217f36a485cae903c713331d877c1f64677e3622ad4010726870540656fe9dcb01",
            );
        });
    });

    describe(".serialize()", () => {
        it("spend p2pkh to p2pkh output", () => {
            const sut = new TxBuilder();
            sut.addInput("9d0e63ad73020a9fad0106b6727e31d36e3ab4b9a01451233926d4759569de68:0"); // prettier-ignore
            sut.addOutput(49.9999, Script.p2pkhLock(pubkeyHashB)); // prettier-ignore

            const commitScript = Script.p2pkhLock(pubkeyHashA);
            const sig = sut.sign(0, commitScript, privA);
            sut.inputs[0].scriptSig = Script.p2pkhUnlock(sig, pubkeyA);

            expect(sut.serialize().toString("hex")).to.equal(
                "020000000168de699575d42639235114a0b9b43a6ed3317e72b60601ad9f0a0273ad630e9d000000006b4830450221009fdc678141bfad627023ae38336716543f91c1b12462673bc9d4fddd6cba5f3c02202e8dd9c9ce538c6bc9b29612ccbf07b3051c13e0f40e92ce3e663060da4c803a012102c13bf903d6147a7fec59b450e2e8a6c174c35a11a7675570d10bd05bc3597996ffffffff01f0ca052a010000001976a914c538c517797dfefdf30142dc1684bfd947532dbb88acffffffff",
            );
        });

        it("spend p2pk to p2pk output", () => {
            const sut = new TxBuilder();
            sut.addInput("68ce1030a63bd7ff44a95f497d3535731cfa3e6b89eda5ce38eb37a6d527d0dc:0"); // prettier-ignore
            sut.addOutput(49.9998, Script.p2pkLock(pubkeyB));

            const commitScript = Script.p2pkLock(pubkeyA);
            const sig = sut.sign(0, commitScript, privA);
            sut.inputs[0].scriptSig = Script.p2pkUnlock(sig);

            expect(sut.serialize().toString("hex")).to.equal(
                "0200000001dcd027d5a637eb38cea5ed896b3efa1c7335357d495fa944ffd73ba63010ce680000000049483045022100d87f7a819cb6ff3140c5ab0f20def422ae1eaa8aade78c33c2368b6be2609d2b022049581379f827bb08f088591d40f7890526aa17403d3e77d2af411774338de7ce01ffffffff01e0a3052a0100000023210334acee9adf0e3e490a422dfe98bc10a8091b43047b793b8d840657b6b6a46c56acffffffff",
            );
        });

        it("spend p2pkh to p2sh-p2pkh output", () => {
            const sut = new TxBuilder();
            sut.addInput("ca5bbd3eec382f2148d8a3f0abe92ee0156bb3657ca9400eecb0812aa2f6f0d9:0");
            sut.addOutput(49.9999, Script.p2shLock(Script.p2pkhLock(pubkeyHashA)));

            const commitScript = Script.p2pkhLock(pubkeyHashA);
            const sig = sut.sign(0, commitScript, privA);
            sut.inputs[0].scriptSig = Script.p2pkhUnlock(sig, pubkeyA);

            expect(sut.serialize().toString("hex")).to.equal(
                "0200000001d9f0f6a22a81b0ec0e40a97c65b36b15e02ee9abf0a3d848212f38ec3ebd5bca000000006a47304402205b1d47b4f0db4fe99b035a87649fbdfc3867e10950d5412b2875cd3774a052c2022037e3c70bfa8e237ed409e409bf6c8b0aa574e44297ed4fc868264ce5148d437a012102c13bf903d6147a7fec59b450e2e8a6c174c35a11a7675570d10bd05bc3597996ffffffff01f0ca052a0100000017a914a7b6b1cc86e6d0b8876040a46da5a346b8662db487ffffffff",
            );
        });

        it("spend p2pkh to p2ms", () => {
            const sut = new TxBuilder();
            sut.addInput("997fd2dd17a5d5843edc23ab7f043130dfe737cf0e02336c75fe37c1eda51195:0");
            sut.addOutput(49.9999, Script.p2msLock(2, pubkeyA, pubkeyB));

            const commitScript = Script.p2pkhLock(pubkeyHashA);
            const sig = sut.sign(0, commitScript, privA);
            sut.inputs[0].scriptSig = Script.p2pkhUnlock(sig, pubkeyA);

            expect(sut.serialize().toString("hex")).to.equal(
                "02000000019511a5edc137fe756c33020ecf37e7df3031047fab23dc3e84d5a517ddd27f99000000006b483045022100eca82b19d1954f6f24292b12dfc49379b536c65c32871309a81ec220750a07bd02205fdff7a71a4727e2fb17b7f089037054a5e6ef30c3ce12796c661ec690292443012102c13bf903d6147a7fec59b450e2e8a6c174c35a11a7675570d10bd05bc3597996ffffffff01f0ca052a0100000047522102c13bf903d6147a7fec59b450e2e8a6c174c35a11a7675570d10bd05bc3597996210334acee9adf0e3e490a422dfe98bc10a8091b43047b793b8d840657b6b6a46c5652aeffffffff",
            );
        });

        it("spend p2ms to p2pkh", () => {
            const sut = new TxBuilder();
            sut.addInput("d6422b4b4c9ec2e8f5f6eaff948241c494397f7e6ca4a2ca2783e3ea3581e27f:0");
            sut.addOutput(49.9998, Script.p2pkhLock(pubkeyHashB));

            const commitScript = Script.p2msLock(2, pubkeyA, pubkeyB);
            const sigA = sut.sign(0, commitScript, privA);
            const sigB = sut.sign(0, commitScript, privB);
            const scriptSig = Script.p2msUnlock(sigA, sigB);
            sut.inputs[0].scriptSig = scriptSig;

            expect(sut.serialize().toString("hex")).to.equal(
                "02000000017fe28135eae38327caa2a46c7e7f3994c4418294ffeaf6f5e8c29e4c4b2b42d6000000009300483045022100d13069b4f0405313c34e42732b66e8633dea520cb39681f53872ba764d91694e02202b18904588344521a38f89fe2ca9273e3e0136a1bf96893f5ae6f50a5f6c4a1001483045022100e453e80486b0788c85b88c9be65740dcdb1de3c92781c828ccfa30f751bf5d75022056a890efe7b061f2986e2e542996f41324a180de80d03b947c009cb5cd1dd0d301ffffffff01e0a3052a010000001976a914c538c517797dfefdf30142dc1684bfd947532dbb88acffffffff",
            );
        });

        it("spend p2sh-p2pkh to p2sh output", () => {
            const sut = new TxBuilder();
            sut.addInput("33e5bb0c1640b1be2a2f2e287c14be86f36cdc831fde0fd953b3a1ab9cb2c8d9:0");
            sut.addOutput(
                49.9998,
                Script.p2shLock(
                    new Script(OpCode.OP_7, OpCode.OP_ADD, OpCode.OP_10, OpCode.OP_EQUAL),
                ),
            );

            const commitScript = Script.p2pkhLock(pubkeyHashA);
            const sig = sut.sign(0, commitScript, privA);
            sut.inputs[0].scriptSig = Script.p2shUnlock(commitScript, sig, pubkeyA);

            expect(sut.serialize().toString("hex")).to.equal(
                "0200000001d9c8b29caba1b353d90fde1f83dc6cf386be147c282e2f2abeb140160cbbe533000000008447304402206cada8b4b6caeadf293627f841244f730aaed74f53709982fd24776643a658d8022026614f756642e08c08b20546f894396187ec1a4ea709a1c69cd036b3ac2f6441012102c13bf903d6147a7fec59b450e2e8a6c174c35a11a7675570d10bd05bc35979961976a9149b40f5b05efd99e4b0c4f62ca63eec3e580e95c788acffffffff01e0a3052a0100000017a9141fec31deece63a911dd9b22fa974ba9760d1bc3d87ffffffff",
            );
        });

        it("spend p2sh to p2sh output", () => {
            const sut = new TxBuilder();
            sut.addInput("a76bb71e2739080f34989c92e1bca2ffe83a9c0d9e424cafe649860cfe11c16c:0");

            sut.addOutput(
                49.9997,
                Script.p2shLock(
                    new Script(OpCode.OP_7, OpCode.OP_ADD, OpCode.OP_12, OpCode.OP_EQUAL),
                ),
            );

            const commitScript = new Script(
                OpCode.OP_7,
                OpCode.OP_ADD,
                OpCode.OP_10,
                OpCode.OP_EQUAL,
            );
            sut.inputs[0].scriptSig = Script.p2shUnlock(commitScript, OpCode.OP_3);

            expect(sut.serialize().toString("hex")).to.equal(
                "02000000016cc111fe0c8649e6af4c429e0d9c3ae8ffa2bce1929c98340f0839271eb76ba70000000006530457935a87ffffffff01d07c052a0100000017a9149a21dbd362501cd7b7790f1c696c55563a8b602c87ffffffff",
            );
        });

        it("spends p2pkh to p2sh-p2ms", () => {
            const sut = new TxBuilder();
            sut.addInput("0382e83cc4692fbd554d621c214263a3414ec0cbbdef0fee73b16992613b8809:0");
            sut.addOutput(49.9999, Script.p2shLock(Script.p2msLock(2, pubkeyA, pubkeyB)));

            const commitScript = Script.p2pkhLock(pubkeyHashA);
            const sig = sut.sign(0, commitScript, privA);
            sut.inputs[0].scriptSig = Script.p2pkhUnlock(sig, pubkeyA);

            expect(sut.serialize().toString("hex")).to.equal(
                "020000000109883b619269b173ee0fefbdcbc04e41a36342211c624d55bd2f69c43ce88203000000006b483045022100b5e8805ca04c0c360fad14768792aaeb80b1be3480e3d69b830ae4903dbc731d02206a4ca0e5e650b709ad94bfb8762bd81d4b31192417d1f9d1956b3b27bce616c6012102c13bf903d6147a7fec59b450e2e8a6c174c35a11a7675570d10bd05bc3597996ffffffff01f0ca052a0100000017a914c5421130046c411fc4616d54d6ba0412328c32cf87ffffffff",
            );
        });

        it("spends p2sh-p2ms to p2pkh", () => {
            const sut = new TxBuilder();
            sut.addInput("26aec57587f3e093f8236706873e3c71f95c18310b688925e657ef9b9ce0309d:0");
            sut.addOutput(49.9998, Script.p2pkhLock(pubkeyHashB));

            const commitScript = Script.p2msLock(2, pubkeyA, pubkeyB);
            const sigA = sut.sign(0, commitScript, privA);
            const sigB = sut.sign(0, commitScript, privB);
            sut.inputs[0].scriptSig = Script.p2shUnlock(
                commitScript,
                Script.p2msUnlock(sigA, sigB),
            );

            expect(sut.serialize().toString("hex")).to.equal(
                "02000000019d30e09c9bef57e62589680b31185cf9713c3e87066723f893e0f38775c5ae2600000000da004830450221008870bcd4ec57b2dbca90b6c3271829f1c2cd519bfd9d3c32e20bfc1d4b3e8419022006ad98bf13ce78636d159587e41683e6053231740b99ac9ec72e7f3201c5a26301473044022045b5beb5060ae43d873b8becda7c62c53968619d49e23a5094705f2e50156c6802206e6f40b795348d756c176c15fbbe61b0ddcb2eecb51623c5f89618ffccca90fc0147522102c13bf903d6147a7fec59b450e2e8a6c174c35a11a7675570d10bd05bc3597996210334acee9adf0e3e490a422dfe98bc10a8091b43047b793b8d840657b6b6a46c5652aeffffffff01e0a3052a010000001976a914c538c517797dfefdf30142dc1684bfd947532dbb88acffffffff",
            );
        });

        it("spends p2pkh to p2pkh and OP_RETURN", () => {
            const sut = new TxBuilder();
            sut.addInput("5d9c67fe1260f9b13bbf6e3b33156bd2b12e56d26be7168467d681032da16ade:0");
            sut.addOutput(Value.fromBitcoin(49.9999), Script.p2pkhLock(pubkeyHashA));
            sut.addOutput(
                Value.zero(),
                new Script(OpCode.OP_RETURN, Buffer.from("Satoshi is my homeboy")),
            );

            const commitScript = Script.p2pkhLock(pubkeyHashA);
            const sig = sut.sign(0, commitScript, privA);
            sut.inputs[0].scriptSig = Script.p2pkhUnlock(sig, pubkeyA);

            expect(sut.serialize().toString("hex")).to.equal(
                "0200000001de6aa12d0381d6678416e76bd2562eb1d26b15333b6ebf3bb1f96012fe679c5d000000006b483045022100922d11bf27877bb36a9090b3d71ea39b653b3f21d3019e82243c1021b781b8dd022071bfded587414b0a833d9f9c06db8745ff05a199066e05a8f3dc3b2a6a670a5c012102c13bf903d6147a7fec59b450e2e8a6c174c35a11a7675570d10bd05bc3597996ffffffff02f0ca052a010000001976a9149b40f5b05efd99e4b0c4f62ca63eec3e580e95c788ac0000000000000000176a155361746f736869206973206d7920686f6d65626f79ffffffff",
            );
        });

        it("spends BIP125 RBF", () => {
            const original = new TxBuilder();
            original.addInput(
                "0085855136b41b0318ba66a33704e1b4a0903e4cf30563a47185e9ce4842f8cb:0",
                Sequence.zero(),
            );
            original.addOutput(49.9999, Script.p2pkhLock(pubkeyB));
            original.locktime = LockTime.zero();
            original.inputs[0].scriptSig = Script.p2pkhUnlock(
                original.sign(0, Script.p2pkhLock(pubkeyA), privA),
                pubkeyA,
            );

            expect(original.serialize().toString("hex")).to.equal(
                "0200000001cbf84248cee98571a46305f34c3e90a0b4e10437a366ba18031bb43651858500000000006b483045022100e0a81464b211f0af994e24e3d474b19312724ae2cb2f3f5bf90459527313eea9022029730f7b9339292c010236ab136e0fb07b27a053460213615df6c65492933afb012102c13bf903d6147a7fec59b450e2e8a6c174c35a11a7675570d10bd05bc35979960000000001f0ca052a010000001976a914c538c517797dfefdf30142dc1684bfd947532dbb88ac00000000",
            );

            const replacement = new TxBuilder();
            replacement.addInput(
                "0085855136b41b0318ba66a33704e1b4a0903e4cf30563a47185e9ce4842f8cb:0",
                Sequence.rbf(),
            );
            replacement.addOutput(49.9998, Script.p2pkhLock(pubkeyB));
            replacement.locktime = LockTime.zero();
            replacement.inputs[0].scriptSig = Script.p2pkhUnlock(
                replacement.sign(0, Script.p2pkhLock(pubkeyA), privA),
                pubkeyA,
            );

            expect(replacement.serialize().toString("hex")).to.equal(
                "0200000001cbf84248cee98571a46305f34c3e90a0b4e10437a366ba18031bb43651858500000000006a473044022049c06ae808ec6593b5c6c0401bb2fd63893c04761bca73da665b60088e9071fa022049cbf7654aca20a460131a9bc6f953e5ea8a9caee77c81178c8d891544725373012102c13bf903d6147a7fec59b450e2e8a6c174c35a11a7675570d10bd05bc3597996fdffffff01e0a3052a010000001976a914c538c517797dfefdf30142dc1684bfd947532dbb88ac00000000",
            );
        });

        it("spends CPFP transaction", () => {
            const parent = new TxBuilder();
            parent.addInput("55151071faaf2fe3081cd84cb3e8b6c7fdeb3ffa009747d727d7b99b820094a5:0");
            parent.addOutput(49.99999, Script.p2pkhLock(pubkeyB));
            parent.inputs[0].scriptSig = Script.p2pkhUnlock(
                parent.sign(0, Script.p2pkhLock(pubkeyA), privA),
                pubkeyA,
            );

            expect(parent.serialize().toString("hex")).to.equal(
                "0200000001a59400829bb9d727d7479700fa3febfdc7b6e8b34cd81c08e32faffa71101555000000006a473044022045ca57fb426080e001e531c8a6fe3203da575ca4dc95ae6fac785911bc0bb1180220636998b4a0d93b55b17006a5eab8dd4533c9e81cbdbc383305c678c3e248c967012102c13bf903d6147a7fec59b450e2e8a6c174c35a11a7675570d10bd05bc3597996ffffffff0118ee052a010000001976a914c538c517797dfefdf30142dc1684bfd947532dbb88acffffffff",
            );

            const child = new TxBuilder();
            child.addInput("5553a10a7eed240ee96f7274159b039f7df22c76c580193ef2f4e7f70b4537e0:0");
            child.addOutput(49.9999, Script.p2pkhLock(pubkeyB));
            child.inputs[0].scriptSig = Script.p2pkhUnlock(
                parent.sign(0, Script.p2pkhLock(pubkeyB), privB),
                pubkeyB,
            );

            expect(parent.serialize().toString("hex")).to.equal(
                "0200000001a59400829bb9d727d7479700fa3febfdc7b6e8b34cd81c08e32faffa71101555000000006a473044022045ca57fb426080e001e531c8a6fe3203da575ca4dc95ae6fac785911bc0bb1180220636998b4a0d93b55b17006a5eab8dd4533c9e81cbdbc383305c678c3e248c967012102c13bf903d6147a7fec59b450e2e8a6c174c35a11a7675570d10bd05bc3597996ffffffff0118ee052a010000001976a914c538c517797dfefdf30142dc1684bfd947532dbb88acffffffff",
            );
        });

        it("spends block based CLTV", () => {
            const redeem = new Script(
                Script.number(200),
                OpCode.OP_CHECKLOCKTIMEVERIFY,  // output is unspendable until block 200
                OpCode.OP_DROP,                 // drop the 200
                pubkeyB,
                OpCode.OP_CHECKSIG,             // only spendable to B
            ); // prettier-ignore

            const tx1 = new TxBuilder();
            tx1.addInput("23a4f5660d5460a110bd38685f315becaf1137b1571371e780987c77ea113125:0");
            tx1.addOutput(49.9999, Script.p2shLock(redeem)); // use p2sh to wrap script
            tx1.inputs[0].scriptSig = Script.p2pkhUnlock(
                tx1.sign(0, Script.p2pkhLock(pubkeyA), privA),
                pubkeyA,
            );

            expect(tx1.serialize().toString("hex")).to.equal(
                "0200000001253111ea777c9880e7711357b13711afec5b315f6838bd10a160540d66f5a423000000006b483045022100c4b4e1a3d2790ebbf8dab7fa6921f3eb5800fa534504084146aa8952117c8d8502201a2e0526e5fcc3a622e05a10c42b0fd38cd7d2731bc5cf0f401d115842311d82012102c13bf903d6147a7fec59b450e2e8a6c174c35a11a7675570d10bd05bc3597996ffffffff01f0ca052a0100000017a914742c427198c79f53f0ddbbd1cf40416ce99fc07387ffffffff",
            );

            const tx2 = new TxBuilder();
            tx2.addInput(
                "db82b592c04587796a2eb43e00fe6e9f342383c747ef356f92d5fb21c4a95b89:0",
                Sequence.locktime(), // required to enable locktime
            );
            tx2.addOutput(49.9998, Script.p2pkhLock(pubkeyB));
            tx2.locktime = new LockTime(200); // locktime must be >= the input value for CLTV
            tx2.inputs[0].scriptSig = Script.p2shUnlock(redeem, tx2.sign(0, redeem, privB)); // provide the redeem script and the signature

            expect(tx2.serialize().toString("hex")).to.equal(
                "0200000001895ba9c421fbd5926f35ef47c78323349f6efe003eb42e6a798745c092b582db0000000072483045022100cfbb72cf18451da98fa093bb333d88895f50ff41804916f9c120c8f8e398e63a022030fc9c98259d4f98573b753cd5adba5aba6b206743ed9e7a67efb9b16eaf32b5012802c800b175210334acee9adf0e3e490a422dfe98bc10a8091b43047b793b8d840657b6b6a46c56acfeffffff01e0a3052a010000001976a914c538c517797dfefdf30142dc1684bfd947532dbb88acc8000000",
            );
        });

        it("spends time-based CLTV", () => {
            const redeem = new Script(
                Script.number(1612137600),
                OpCode.OP_CHECKLOCKTIMEVERIFY,  // output is unspendable until Feb 01 2021
                OpCode.OP_DROP,                 // drop the timelock
                pubkeyB,
                OpCode.OP_CHECKSIG,             // only spendable to B
            ); // prettier-ignore

            const tx1 = new TxBuilder();
            tx1.addInput("366401232aa585346495fed6fa5e88e5f220e6eaf5423b952ef03d41903cd680:0");
            tx1.addOutput(49.9999, Script.p2shLock(redeem)); // use p2sh to wrap script
            tx1.inputs[0].scriptSig = Script.p2pkhUnlock(
                tx1.sign(0, Script.p2pkhLock(pubkeyA), privA),
                pubkeyA,
            );

            expect(tx1.serialize().toString("hex")).to.equal(
                "020000000180d63c90413df02e953b42f5eae620f2e5885efad6fe95643485a52a23016436000000006a473044022050f7bf534dd1a001b62c861ff49c4d5cab9cb81bf2e3c36529df877cbcbcd89c0220618554468a644c9ea204df842e819369f76c15bb34ddd3f947bb53b397704216012102c13bf903d6147a7fec59b450e2e8a6c174c35a11a7675570d10bd05bc3597996ffffffff01f0ca052a0100000017a914cda8dc88b3433c055566bf12e4d855b011185a1387ffffffff",
            );

            const tx2 = new TxBuilder();
            tx2.addInput(
                "94bdc0c7d032a487b2d4637dfc9d6bd8788e5cf2ea8bde542dc2e99383f07877:0",
                Sequence.locktime(), // required to enable locktime
            );
            tx2.addOutput(49.9998, Script.p2pkhLock(pubkeyB));
            tx2.locktime = new LockTime(1612137600); // locktime must be >= the input value for CLTV
            tx2.inputs[0].scriptSig = Script.p2shUnlock(redeem, tx2.sign(0, redeem, privB)); // provide the redeem script and the signature

            expect(tx2.serialize().toString("hex")).to.equal(
                "02000000017778f08393e9c22d54de8beaf25c8e78d86b9dfc7d63d4b287a432d0c7c0bd94000000007347304402202e3d313be0b7c5719020c7bab6812cad7efaf37b9c5acffcc9106be041da34670220585e39f85f96e204434dee5328df7b66399160197a91f768abd0638f0a40f065012a0480441760b175210334acee9adf0e3e490a422dfe98bc10a8091b43047b793b8d840657b6b6a46c56acfeffffff01e0a3052a010000001976a914c538c517797dfefdf30142dc1684bfd947532dbb88ac80441760",
            );
        });

        it("spends CSV block delay", () => {
            const delay = Sequence.blockDelay(10);

            const redeem = new Script(
                Script.number(delay.value),
                OpCode.OP_CHECKSEQUENCEVERIFY,
                OpCode.OP_DROP,
                pubkeyB,
                OpCode.OP_CHECKSIG,
            );

            const tx1 = new TxBuilder();
            tx1.addInput("b6a17e12642a0b922fe519392c1427fd172673fd60ba4cb2ffc34edfb34a8075:0");
            tx1.addOutput(49.9999, Script.p2shLock(redeem));
            tx1.inputs[0].scriptSig = Script.p2pkhUnlock(
                tx1.sign(0, Script.p2pkhLock(pubkeyA), privA),
                pubkeyA,
            );

            expect(tx1.serialize().toString("hex")).to.equal(
                "020000000175804ab3df4ec3ffb24cba60fd732617fd27142c3919e52f920b2a64127ea1b6000000006a47304402204327e53982f3e74c4d4aef2c885ba1c1eb9f25e6295822fc925186c3e7e292c8022036d592e8d2dcec4bd59dc7e59ab0a835efecd0f5e9c57ccf85e322b059c1a184012102c13bf903d6147a7fec59b450e2e8a6c174c35a11a7675570d10bd05bc3597996ffffffff01f0ca052a0100000017a914ed3c8dd59a6e8e75ce036c7c31c872623f2b1a9387ffffffff",
            );

            // must wait until 10 blocks have been mined

            const tx2 = new TxBuilder();
            tx2.addInput(
                "6648789a901fb81d267ea6fdd63ce037487c2a43ddeaa2dde55daf49a7456c2f:0",
                delay,
            );
            tx2.addOutput(49.9998, Script.p2pkhLock(pubkeyB));
            tx2.locktime = LockTime.zero(); // required to enable csv
            tx2.inputs[0].scriptSig = Script.p2shUnlock(redeem, tx2.sign(0, redeem, privB));

            expect(tx2.serialize().toString("hex")).to.equal(
                "02000000012f6c45a749af5de5dda2eadd432a7c4837e03cd6fda67e261db81f909a78486600000000704830450221009f8f1108cbccff797d44cefd43ebce703e761760ce5a6e466392732a3ac243b102202a5209d21c8f6491140a8a75572ed35cdc0b2b8f39079f72bf275a365b82deb101265ab275210334acee9adf0e3e490a422dfe98bc10a8091b43047b793b8d840657b6b6a46c56ac0a00000001e0a3052a010000001976a914c538c517797dfefdf30142dc1684bfd947532dbb88ac00000000",
            );
        });

        it("spends CSV time delay", () => {
            const delay = Sequence.timeDelay(512);

            const redeem = new Script(
                Script.number(delay.value),
                OpCode.OP_CHECKSEQUENCEVERIFY,
                OpCode.OP_DROP,
                pubkeyB,
                OpCode.OP_CHECKSIG,
            );

            const tx1 = new TxBuilder();
            tx1.addInput("913aa0afb8e76ed1f7d8fff1d612d16b89845d2c26156d79dd80b860f343e264:0");
            tx1.addOutput(49.9999, Script.p2shLock(redeem));
            tx1.inputs[0].scriptSig = Script.p2pkhUnlock(
                tx1.sign(0, Script.p2pkhLock(pubkeyA), privA),
                pubkeyA,
            );

            expect(tx1.serialize().toString("hex")).to.equal(
                "020000000164e243f360b880dd796d15262c5d84896bd112d6f1ffd8f7d16ee7b8afa03a91000000006b483045022100bfe13ec04ceae98bc48dee4a09c65382e3fb55b66f5ee4371264c061b3357afd022077cfc2811489f494d574868608d6b23fcee2fc207ed80fec207941760dc04e76012102c13bf903d6147a7fec59b450e2e8a6c174c35a11a7675570d10bd05bc3597996ffffffff01f0ca052a0100000017a914260335081af6076153c097891a27ebc4c52bc98887ffffffff",
            );

            // must wait until 512 seconds after MTP of included tx

            const tx2 = new TxBuilder();
            tx2.addInput(
                "affd587c75bc4ca8d9963f8c4a184e71bf8ca983ed67ee74749885c52df18e3d:0",
                delay,
            );
            tx2.addOutput(49.9998, Script.p2pkhLock(pubkeyB));
            tx2.locktime = LockTime.zero(); // required to enable csv
            tx2.inputs[0].scriptSig = Script.p2shUnlock(redeem, tx2.sign(0, redeem, privB));

            expect(tx2.serialize().toString("hex")).to.equal(
                "02000000013d8ef12dc585987474ee67ed83a98cbf714e184a8c3f96d9a84cbc757c58fdaf0000000073483045022100ac805ac0ab29fdf1c9c4419a6e862f4ca9d44b0ee446ff2b89318499f34fc07702205efbc4d0badd316a7fc9086f24f39f4a9b03032d630abc916cbe643e1198ab24012903010040b275210334acee9adf0e3e490a422dfe98bc10a8091b43047b793b8d840657b6b6a46c56ac0100400001e0a3052a010000001976a914c538c517797dfefdf30142dc1684bfd947532dbb88ac00000000",
            );
        });

        it("spends P2PKH to P2WPKH", () => {
            const tx = new TxBuilder();
            tx.addInput("5a31aa621739c5643c542538ca99d7c46a4462d0f32c81cb6bdb33dbb838ebb0:0");
            tx.addOutput(49.9999, Script.p2wpkhLock(pubkeyB));

            // spends legacy p2pkh
            tx.inputs[0].scriptSig = Script.p2pkhUnlock(
                tx.sign(0, Script.p2pkhLock(pubkeyA), privA),
                pubkeyA,
            );

            expect(tx.serialize().toString("hex")).to.equal(
                "0200000001b0eb38b8db33db6bcb812cf3d062446ac4d799ca3825543c64c5391762aa315a000000006a4730440220347ee6d681390ed67c63c7c496799cff84faa1c176821e270213aaa98f9b653a02202967a1b8d79843d8680a0020752906e3211480b549c58827c34b44444b0e8766012102c13bf903d6147a7fec59b450e2e8a6c174c35a11a7675570d10bd05bc3597996ffffffff01f0ca052a01000000160014c538c517797dfefdf30142dc1684bfd947532dbbffffffff",
            );
        });

        it("BIP143 P2WPKH Test Vector", () => {
            const priv1 = Buffer.from("bbc27228ddcb9209d7fd6f36b02f7dfa6252af40bb2f1cbc7a557da8027ff866", "hex"); // prettier-ignore
            const pubkey1 = Buffer.from("03c9f4836b9a4f77fc0d81f7bcb01b7f1b35916864b9476c241ce9fc198bd25432", "hex"); // prettier-ignore

            const priv2 = Buffer.from("619c335025c7f4012e556c2a58b2506e30b8511b53ade95ea316fd8c3286feb9", "hex"); // prettier-ignore
            const pubkey2 = Buffer.from("025476c2e83188368da1ff3e292e7acafcdb3566bb0ad253f62fc70f07aeee6357", "hex"); // prettier-ignore

            const tx = new TxBuilder();
            tx.version = 1;
            tx.addInput(TxIn.fromHex("fff7f7881a8099afa6940d42d1e7f6362bec38171ea3edf433541db4e4ad969f0000000000eeffffff")); // prettier-ignore
            tx.addInput(TxIn.fromHex("ef51e1b804cc89d182d279655c3aa89e815b1b309fe287d9b2b55d57b90ec68a0100000000ffffffff")); // prettier-ignore
            tx.addOutput(TxOut.fromHex("202cb206000000001976a9148280b37df378db99f66f85c95a783a76ac7a6d5988ac")); // prettier-ignore
            tx.addOutput(TxOut.fromHex("9093510d000000001976a9143bde42dbee7e4dbe6a21b2d50ce2f0167faa815988ac")); // prettier-ignore
            tx.locktime = LockTime.parse(StreamReader.fromHex("11000000"));

            // sign p2pk input and apply scriptsig
            tx.inputs[0].scriptSig = Script.p2pkUnlock(tx.sign(0, Script.p2pkLock(pubkey1), priv1));

            // sign p2wpkh input and apply to witness
            tx.inputs[1].witness.push(
                new Witness(
                    tx.signSegWitv0(1, Script.p2pkhLock(pubkey2), priv2, Value.fromBitcoin(6)),
                ),
            );
            tx.inputs[1].witness.push(new Witness(pubkey2));

            expect(tx.serialize().toString("hex")).to.equal(
                "01000000000102fff7f7881a8099afa6940d42d1e7f6362bec38171ea3edf433541db4e4ad969f00000000494830450221008b9d1dc26ba6a9cb62127b02742fa9d754cd3bebf337f7a55d114c8e5cdd30be022040529b194ba3f9281a99f2b1c0a19c0489bc22ede944ccf4ecbab4cc618ef3ed01eeffffffef51e1b804cc89d182d279655c3aa89e815b1b309fe287d9b2b55d57b90ec68a0100000000ffffffff02202cb206000000001976a9148280b37df378db99f66f85c95a783a76ac7a6d5988ac9093510d000000001976a9143bde42dbee7e4dbe6a21b2d50ce2f0167faa815988ac000247304402203609e17b84f6a7d30c80bfa610b5b4542f32a8a0d5447a12fb1366d7f01cc44a0220573a954c4518331561406f90300e8f3358f51928d43c212a8caed02de67eebee0121025476c2e83188368da1ff3e292e7acafcdb3566bb0ad253f62fc70f07aeee635711000000",
            );
        });

        it("spends P2WPKH to P2WPKH", () => {
            const tx = new TxBuilder();
            tx.addInput("41e441eb2cfc6bc7dd238361daa4660677a1e253d4749a508ba26a83b84ce815:0");
            tx.addOutput(49.9998, Script.p2wpkhLock(pubkeyA));

            // provide witness data to spend p2wpkh
            tx.inputs[0].witness.push(
                new Witness(
                    tx.signSegWitv0(
                        0,
                        Script.p2pkhLock(pubkeyB),
                        privB,
                        Value.fromBitcoin(49.9999),
                    ),
                ),
            );
            tx.inputs[0].witness.push(new Witness(pubkeyB));

            expect(tx.serialize().toString("hex")).to.equal(
                "0200000000010115e84cb8836aa28b509a74d453e2a1770666a4da618323ddc76bfc2ceb41e4410000000000ffffffff01e0a3052a010000001600149b40f5b05efd99e4b0c4f62ca63eec3e580e95c702483045022100a355feb29d36e89c3693a2d5e33c8143ffba3428db2cc0ace021d955a649d2c5022001298dddb1627e313664dbce0311c453939c6fa88ad3cb8ff6f49287d13b3d9f01210334acee9adf0e3e490a422dfe98bc10a8091b43047b793b8d840657b6b6a46c56ffffffff",
            );
        });

        it("spends P2PKH to P2WSH", () => {
            const tx = new TxBuilder();
            tx.addInput("b7c1cc3923e43147534ca19d05d0d2d666f5f95883bac08342b856a63f1b7f7a:0");
            tx.addOutput(49.9999, Script.p2wshLock(Script.p2msLock(2, pubkeyA, pubkeyB).sha256()));
            tx.inputs[0].scriptSig = Script.p2pkhUnlock(
                tx.sign(0, Script.p2pkhLock(pubkeyA), privA),
                pubkeyA,
            );

            expect(tx.serialize().toString("hex")).to.equal(
                "02000000017a7f1b3fa656b84283c0ba8358f9f566d6d2d0059da14c534731e42339ccc1b7000000006a47304402200624e1984699741cae90176a094965d1a33568b6d64d72eef17f44b6bafefeb0022025930447bdaf5286f798122276e392ba0f3a328fb7f8c572b3c81b51ea5890de012102c13bf903d6147a7fec59b450e2e8a6c174c35a11a7675570d10bd05bc3597996ffffffff01f0ca052a01000000220020f667d4b67b93ccd86992d8cd6f183210c6c12ddb3f6c78123118211e823e2776ffffffff",
            );
        });

        it("spends P2WSH to P2WPK", () => {
            const tx = new TxBuilder();
            tx.addInput("c53bb09e5cd33bf9f314c8e43f9f5e9b7356433c48dc223740af493ab7069d40:0");
            tx.addOutput(49.9998, Script.p2wpkhLock(pubkeyA));
            tx.inputs[0].witness.push(new Witness(Buffer.alloc(0)));

            const commitScript = Script.p2msLock(2, pubkeyA, pubkeyB);
            const value = Value.fromBitcoin(49.9999);
            tx.inputs[0].witness.push(new Witness(tx.signSegWitv0(0, commitScript, privA, value)));
            tx.inputs[0].witness.push(new Witness(tx.signSegWitv0(0, commitScript, privB, value)));
            tx.inputs[0].witness.push(new Witness(commitScript.serializeCmds()));

            expect(tx.serialize().toString("hex")).to.equal(
                "02000000000101409d06b73a49af403722dc483c4356739b5e9f3fe4c814f3f93bd35c9eb03bc50000000000ffffffff01e0a3052a010000001600149b40f5b05efd99e4b0c4f62ca63eec3e580e95c7040047304402203045ecb8cd434c3f7e66ced622f454a22541c13e50136ea523b05944ef15b39a02205f784f22c4946c77a03191ec00760c981100e969b9e2283d9c170f72fea3b64101483045022100eb31935352b66f8f02dee387374c7113d19fd0c62dacdace62d20f356e5b2d3602203619e58831acba50a2fb64bc615a03ae565d51e75492b0b5aa59067c1e0b34b90147522102c13bf903d6147a7fec59b450e2e8a6c174c35a11a7675570d10bd05bc3597996210334acee9adf0e3e490a422dfe98bc10a8091b43047b793b8d840657b6b6a46c5652aeffffffff",
            );
        });

        it("spends P2PKH to P2SH-P2WPKH", () => {
            const tx = new TxBuilder();
            tx.addInput("6f39db0a1892c8ac9201143f8d5dc4fd39976e38eef29cdc67108bfce97b0810:0");
            tx.addOutput(49.9998, Script.p2shLock(Script.p2wpkhLock(pubkeyB)));
            tx.inputs[0].scriptSig = Script.p2pkhUnlock(
                tx.sign(0, Script.p2pkhLock(pubkeyA), privA),
                pubkeyA,
            );

            expect(tx.serialize().toString("hex")).to.equal(
                "020000000110087be9fc8b1067dc9cf2ee386e9739fdc45d8d3f140192acc892180adb396f000000006a473044022040e3dd16bdea9d900bfebefef1038719ff3b00f96cf9d5b277f77d0a5d7e88210220610227a837b062a9c533370e4fb431fefb23551657565cc4fbb0769ab0091c63012102c13bf903d6147a7fec59b450e2e8a6c174c35a11a7675570d10bd05bc3597996ffffffff01e0a3052a0100000017a914f943a3b24246bc673c647ca6e5772173f729387387ffffffff",
            );
        });

        it("spends P2SH-P2WPKH to P2WPKH", () => {
            const tx = new TxBuilder();
            tx.addInput("a21e120c7d256e21a40f82ff24000d6d9823a28c7f573190b11727caa9e0428a:0");
            tx.addOutput(49.9997, Script.p2wpkhLock(pubkeyB));
            tx.inputs[0].scriptSig = Script.p2shUnlock(Script.p2wpkhLock(pubkeyB)); // redeem script for p2sh
            tx.inputs[0].witness.push(
                new Witness(
                    tx.signSegWitv0(
                        0,
                        Script.p2pkhLock(pubkeyB),
                        privB,
                        Value.fromBitcoin(49.9998),
                    ),
                ),
            );
            tx.inputs[0].witness.push(new Witness(pubkeyB));

            expect(tx.serialize().toString("hex")).to.equal(
                "020000000001018a42e0a9ca2717b19031577f8ca223986d0d0024ff820fa4216e257d0c121ea20000000017160014c538c517797dfefdf30142dc1684bfd947532dbbffffffff01d07c052a01000000160014c538c517797dfefdf30142dc1684bfd947532dbb02483045022100dffb1e407f8b8545fd79d27de887a3152a611cef99952eb56ddf3795b3bdbf25022021904ce657abfa85004a94a8aee1b59997dae5ad4401ba926d476df6f35e890a01210334acee9adf0e3e490a422dfe98bc10a8091b43047b793b8d840657b6b6a46c56ffffffff",
            );
        });

        it("BIP 143 P2SH-P2WPKH Test Vector", () => {
            const pubkey = Buffer.from("03ad1d8e89212f0b92c74d23bb710c00662ad1470198ac48c43f7d6f93a2a26873", "hex"); // prettier-ignore
            const privkey = Buffer.from("eb696a065ef48a2192da5b28b694f87544b30fae8327c4510137a922f32c6dcf", "hex"); // prettier-ignore
            const tx = new TxBuilder();
            tx.version = 1;
            tx.addInput(TxIn.fromHex("db6b1b20aa0fd7b23880be2ecbd4a98130974cf4748fb66092ac4d3ceb1a54770100000000feffffff")); // prettier-ignore
            tx.addOutput(TxOut.fromHex("b8b4eb0b000000001976a914a457b684d7f0d539a46a45bbc043f35b59d0d96388ac")); // prettier-ignore
            tx.addOutput(TxOut.fromHex("0008af2f000000001976a914fd270b1ee6abcaea97fea7ad0402e8bd8ad6d77c88ac")); // prettier-ignore
            tx.locktime = LockTime.parse(StreamReader.fromHex("92040000"));
            tx.inputs[0].scriptSig = Script.p2shUnlock(Script.p2wpkhLock(pubkey));
            tx.inputs[0].witness.push(
                new Witness(
                    tx.signSegWitv0(0, Script.p2pkhLock(pubkey), privkey, Value.fromBitcoin(10)),
                ),
            );
            tx.inputs[0].witness.push(new Witness(pubkey));

            expect(tx.serialize().toString("hex")).to.equal(
                "01000000000101db6b1b20aa0fd7b23880be2ecbd4a98130974cf4748fb66092ac4d3ceb1a5477010000001716001479091972186c449eb1ded22b78e40d009bdf0089feffffff02b8b4eb0b000000001976a914a457b684d7f0d539a46a45bbc043f35b59d0d96388ac0008af2f000000001976a914fd270b1ee6abcaea97fea7ad0402e8bd8ad6d77c88ac02473044022047ac8e878352d3ebbde1c94ce3a10d057c24175747116f8288e5d794d12d482f0220217f36a485cae903c713331d877c1f64677e3622ad4010726870540656fe9dcb012103ad1d8e89212f0b92c74d23bb710c00662ad1470198ac48c43f7d6f93a2a2687392040000",
            );
        });

        it("spends P2PKH to P2SH-P2WSH-P2MS", () => {
            const tx = new TxBuilder();
            tx.addInput("d9a81605b0ecb6df24812333194df07584ed32c4c5717c6b448c458114090fa4:0");
            tx.addOutput(
                49.9999,
                Script.p2shLock(Script.p2wshLock(Script.p2msLock(2, pubkeyA, pubkeyB))),
            );
            tx.inputs[0].scriptSig = Script.p2pkhUnlock(
                tx.sign(0, Script.p2pkhLock(pubkeyA), privA),
                pubkeyA,
            );

            expect(tx.serialize().toString("hex")).to.equal(
                "0200000001a40f091481458c446b7c71c5c432ed8475f04d1933238124dfb6ecb00516a8d9000000006a4730440220270bc7ab5f68002c19035974478970443977200feacfb8a0e8414e976327ba9b0220289a1463f8a8cf454b88c331fe60b70f7810a854f6f2034f7612c76c08d9cb24012102c13bf903d6147a7fec59b450e2e8a6c174c35a11a7675570d10bd05bc3597996ffffffff01f0ca052a0100000017a914b940731d3de22bbd7b75144dba433c1ef34a1e6c87ffffffff",
            );
        });

        it("spends P2SH-P2WSH-P2MS to P2WPKH", () => {
            const tx = new TxBuilder();
            tx.addInput("b2118a5883bd69ad9e4812105874a8725cb80dd5c2df899bb218371bbf07ae7d:0");
            tx.addOutput(49.9998, Script.p2wpkhLock(pubkeyB));

            // witnessScript is used to generate the sha256 in the witness program
            // witnessScript is also the commitScript for the signatures
            const witnessScript = Script.p2msLock(2, pubkeyA, pubkeyB);

            // redeemScript is a P2WSH witness program hash sha256 hashes the witness Script
            const redeemScript = Script.p2wshLock(witnessScript);

            // scriptSig only contains the redeemScript
            tx.inputs[0].scriptSig = Script.p2shUnlock(redeemScript);

            // commit to the prior input value
            const value = Value.fromBitcoin(49.9999);

            // push the signatures and witness script onto the witness data
            tx.inputs[0].witness.push(new Witness(Buffer.alloc(0)));
            tx.inputs[0].witness.push(new Witness(tx.signSegWitv0(0, witnessScript, privA, value)));
            tx.inputs[0].witness.push(new Witness(tx.signSegWitv0(0, witnessScript, privB, value)));
            tx.inputs[0].witness.push(new Witness(witnessScript.serializeCmds()));

            expect(tx.serialize().toString("hex")).to.equal(
                "020000000001017dae07bf1b3718b29b89dfc2d50db85c72a874581012489ead69bd83588a11b20000000023220020f667d4b67b93ccd86992d8cd6f183210c6c12ddb3f6c78123118211e823e2776ffffffff01e0a3052a01000000160014c538c517797dfefdf30142dc1684bfd947532dbb0400483045022100dfde803231cb986e0d1e1201813b0f0ee221d93d1fa34fc75cc349298c1de880022055dc330df7f296ae28a0f26549eed8d177269818bc1c97e2ee73a6de0d4069bd01473044022040cc31d846e73739218d71803c105e30f32d586f773a8760da228817aee5cd7402204f9030e3b1e53100ef5732b7de1461bc2c16d6709962053e6b1707bce8f679e00147522102c13bf903d6147a7fec59b450e2e8a6c174c35a11a7675570d10bd05bc3597996210334acee9adf0e3e490a422dfe98bc10a8091b43047b793b8d840657b6b6a46c5652aeffffffff",
            );
        });

        it("spends P2PKH to P2SH-P2WSH", () => {
            const tx = new TxBuilder();
            tx.addInput("7141a4e6bf580183109d218b3071d877b4395c0cc90f2434372e5c2d9e673876:0");
            tx.addOutput(
                49.9999,
                Script.p2shLock(
                    Script.p2wshLock(
                        new Script(OpCode.OP_3, OpCode.OP_ADD, OpCode.OP_10, OpCode.OP_EQUAL),
                    ),
                ),
            );
            tx.inputs[0].scriptSig = Script.p2pkhUnlock(
                tx.sign(0, Script.p2pkhLock(pubkeyA), privA),
                pubkeyA,
            );

            expect(tx.serialize().toString("hex")).to.equal(
                "02000000017638679e2d5c2e3734240fc90c5c39b477d871308b219d10830158bfe6a44171000000006b483045022100f27cbe1d5999629c31f956e2dfaf612c591e2fa6a168d10cd8bcdf70169866d50220372d9ada03127377c6c1fb8767e4c4cdc7239799f470f4b0c30176a537a8b04d012102c13bf903d6147a7fec59b450e2e8a6c174c35a11a7675570d10bd05bc3597996ffffffff01f0ca052a0100000017a914d439a1a387a85dd19b1ed212233c603d5e6916b687ffffffff",
            );
        });

        it("spends P2SH-P2WSH to P2WPKH", () => {
            const tx = new TxBuilder();
            tx.addInput("09a040b6126eb9a1cbf55ef2af28bbef063f219c59b25054d8d8542966a11051:0");
            tx.addOutput(49.9998, Script.p2wpkhLock(pubkeyB));

            // witnessScript is used to generate the sha256 in the witness program
            // witnessScript is also the commitScript for the signatures
            const witnessScript = new Script(
                OpCode.OP_3,
                OpCode.OP_ADD,
                OpCode.OP_10,
                OpCode.OP_EQUAL,
            );

            // redeemScript is a P2WSH witness program hash sha256 hashes the witness Script
            const redeemScript = Script.p2wshLock(witnessScript);

            // scriptSig only contains the redeemScript
            tx.inputs[0].scriptSig = Script.p2shUnlock(redeemScript);

            // commit to the prior input value
            // const value = Value.fromBitcoin(49.9999);

            // push witness data as bytes and witness script onto the witness stack
            tx.inputs[0].witness.push(new Witness(Stack.encodeNum(7)));
            tx.inputs[0].witness.push(new Witness(witnessScript.serializeCmds()));

            expect(tx.serialize().toString("hex")).to.equal(
                "020000000001015110a1662954d8d85450b2599c213f06efbb28aff25ef5cba1b96e12b640a0090000000023220020e37b180c5e060a87ebf395bfdfb766346c71325a059a047a5572f5df5d88e9f6ffffffff01e0a3052a01000000160014c538c517797dfefdf30142dc1684bfd947532dbb0201070453935a87ffffffff",
            );
        });
    });
});
