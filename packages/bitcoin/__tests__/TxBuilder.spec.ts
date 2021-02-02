import { BufferReader } from "@node-lightning/bufio";
import { getPublicKey, hash160 } from "@node-lightning/crypto";
import { expect } from "chai";
import { encodeNum } from "../lib/encodeNum";
import { OpCode } from "../lib/OpCodes";
import { OutPoint } from "../lib/OutPoint";
import { Script } from "../lib/Script";
import { TxBuilder } from "../lib/TxBuilder";
import { TxInSequence } from "../lib/TxInSequence";
import { TxLockTime } from "../lib/TxLockTime";
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
                new TxInSequence(0),
            );
            original.addOutput(49.9999, Script.p2pkhLock(pubkeyB));
            original.locktime = new TxLockTime(0);
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
                new TxInSequence(0xfffffffd),
            );
            replacement.addOutput(49.9998, Script.p2pkhLock(pubkeyB));
            replacement.locktime = new TxLockTime(0);
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
                encodeNum(200),
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
                new TxInSequence(0xfffffffe), // required to enable locktime
            );
            tx2.addOutput(49.9998, Script.p2pkhLock(pubkeyB));
            tx2.locktime = new TxLockTime(200); // locktime must be >= the input value for CLTV
            tx2.inputs[0].scriptSig = Script.p2shUnlock(redeem, tx2.sign(0, redeem, privB)); // provide the redeem script and the signature

            expect(tx2.serialize().toString("hex")).to.equal(
                "0200000001895ba9c421fbd5926f35ef47c78323349f6efe003eb42e6a798745c092b582db0000000072483045022100cfbb72cf18451da98fa093bb333d88895f50ff41804916f9c120c8f8e398e63a022030fc9c98259d4f98573b753cd5adba5aba6b206743ed9e7a67efb9b16eaf32b5012802c800b175210334acee9adf0e3e490a422dfe98bc10a8091b43047b793b8d840657b6b6a46c56acfeffffff01e0a3052a010000001976a914c538c517797dfefdf30142dc1684bfd947532dbb88acc8000000",
            );
        });
    });
});
