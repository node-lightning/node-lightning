import { StreamReader } from "@node-lightning/bufio";
import { getPublicKey, hash160 } from "@node-lightning/crypto";
import { expect } from "chai";
import { time } from "console";
import { OpCode } from "../lib/OpCodes";
import { OutPoint } from "../lib/OutPoint";
import { Script } from "../lib/Script";
import { Tx } from "../lib/Tx";
import { TxBuilder } from "../lib/TxBuilder";
import { TxIn } from "../lib/TxIn";
import { TxInSequence } from "../lib/TxInSequence";
import { TxLockTime } from "../lib/TxLockTime";
import { TxOut } from "../lib/TxOut";
import { Value } from "../lib/Value";

// 1:
// address: mufrrGX5ei1g2GBjKBBYvidioNqN7GWJsD
// pkh:     9b40f5b05efd99e4b0c4f62ca63eec3e580e95c7
// wif:     cSV9NvF6Gk3gTXgrpfPrjkHCyb4CLQZD3nsQSYUKGH4PPsRS8J2M
// priv:    92541d4cdb6f0db05949e4fd91d7cb936f84eb21a62b477103d0e1957e6ad782

// 2:
// address: myVmRHXHq6qzW7s7TCseBLLgajKxT6Z19j
// pkh:     c538c517797dfefdf30142dc1684bfd947532dbb
// wif:     cSAyZjTwLx2eh76MfL5zmGV8n7pk61Lx5We2S95UGyhiwoSgJgv2
// priv:    88fb4d47adfd310bf071d67c8ac569f58d8e4c4d8d94b778c010ddd0e2ff6a48

//
// bitcoin-cli -regtest getnewaddress addr2 legacy
// bitcoin-cli -regtest dumpprivkey mufrrGX5ei1g2GBjKBBYvidioNqN7GWJsD
// bitcoin-cli -regtest generatetoaddress 101 mufrrGX5ei1g2GBjKBBYvidioNqN7GWJsD
// bitcoin-cli -regtest generatetoaddress 1 mufrrGX5ei1g2GBjKBBYvidioNqN7GWJsD
// bitcoin-cli -regtest sendrawtransaction 020000000168de699575d42639235114a0b9b43a6ed3317e72b60601ad9f0a0273ad630e9d000000006b4830450221009fdc678141bfad627023ae38336716543f91c1b12462673bc9d4fddd6cba5f3c02202e8dd9c9ce538c6bc9b29612ccbf07b3051c13e0f40e92ce3e663060da4c803a012102c13bf903d6147a7fec59b450e2e8a6c174c35a11a7675570d10bd05bc3597996ffffffff01f0ca052a010000001976a914c538c517797dfefdf30142dc1684bfd947532dbb88acffffffff
// 4fc69683b7f02a4750cad1847d21d469f4189acac2af24042d1f9356b8ef2181

describe("TxBuilder", () => {
    const privA = Buffer.from("92541d4cdb6f0db05949e4fd91d7cb936f84eb21a62b477103d0e1957e6ad782", "hex"); // prettier-ignore
    const pubkeyA = getPublicKey(privA, true);
    const pubkeyHashA = hash160(pubkeyA);

    const privB = Buffer.from("88fb4d47adfd310bf071d67c8ac569f58d8e4c4d8d94b778c010ddd0e2ff6a48", "hex"); // prettier-ignore
    const pubkeyB = getPublicKey(privB, true);
    const pubkeyHashB = hash160(pubkeyB);

    /**
     * Spends a transaction with a p2pkh input that pays to a p2pkh outputs
     */
    function createP2PKH(): [TxBuilder, TxOut] {
        const txBuilder = new TxBuilder();
        txBuilder.version = 2;
        txBuilder.addInput(OutPoint.fromString("9d0e63ad73020a9fad0106b6727e31d36e3ab4b9a01451233926d4759569de68:0")); // prettier-ignore
        txBuilder.addOutput(Value.fromBitcoin(49.9999), Script.p2pkhLock(pubkeyHashB)); // prettier-ignore

        const prevOut = new TxOut(Value.fromBitcoin(50), Script.p2pkhLock(pubkeyHashA));

        txBuilder.setScriptSig(0, Script.p2pkhUnlock(txBuilder.sign(privA, 0, prevOut), pubkeyA));

        return [txBuilder, prevOut];
    }

    /**
     * Spends a transaction with a p2pk input that pays to a p2pk output
     */
    function createP2PK(): [TxBuilder, TxOut] {
        const sut = new TxBuilder();
        sut.version = 2;
        sut.addInput(OutPoint.fromString("68ce1030a63bd7ff44a95f497d3535731cfa3e6b89eda5ce38eb37a6d527d0dc:0")); // prettier-ignore
        sut.addOutput(Value.fromBitcoin(49.9998), Script.p2pkLock(pubkeyB));

        const prevOut = new TxOut(Value.fromBitcoin(49.9999), Script.p2pkLock(pubkeyA));
        sut.setScriptSig(0, Script.p2pkUnlock(sut.sign(privA, 0, prevOut)));

        return [sut, prevOut];
    }

    // /**
    //  *
    //  */
    function spend_p2pkh_to_p2sh_p2pkh() {
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

        const prevout = new TxOut(Value.fromBitcoin(50), Script.p2pkhLock(pubkeyHashA));
        const sig = sut.sign(privA, 0, prevout);
        sut.setScriptSig(0, Script.p2pkhUnlock(sig, pubkeyA));

        console.log("SPENDING");
        console.log(sut.serialize().toString("hex"));
    }

    /**
     * Creates a transaction with a single P2SH-P2PKH input that spends
     * to a single P2SH output.
     *
     * nVersion: 2
     * vin[0]
     *      txid:
     */
    function spend_p2sh_p2pkh_to_p2sh(): [TxBuilder, Script] {
        const sut = new TxBuilder();
        sut.version = 2;
        // p2sh-p2pkh
        sut.addInput(
            OutPoint.fromString(
                "33e5bb0c1640b1be2a2f2e287c14be86f36cdc831fde0fd953b3a1ab9cb2c8d9:0",
            ),
        );
        // x + 7 = 10
        sut.addOutput(
            Value.fromBitcoin(49.9998),
            Script.p2shLock(
                new Script(OpCode.OP_7, OpCode.OP_ADD, OpCode.OP_10, OpCode.OP_EQUAL).hash160(),
            ),
        );

        const sig = sut.sign(
            privA,
            0,
            new TxOut(Value.fromBitcoin(1), Script.p2pkhLock(pubkeyHashA)),
        );
        sut.setScriptSig(
            0,
            new Script(sig, pubkeyA, Script.p2pkhLock(pubkeyHashA).serializeCmds()),
        );

        return [sut, Script.p2pkhLock(pubkeyHashA)];
    }

    function spend_p2sh_to_p2sh(): [TxBuilder, Script] {
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

        const redeem = new Script(OpCode.OP_7, OpCode.OP_ADD, OpCode.OP_10, OpCode.OP_EQUAL);
        sut.setScriptSig(0, new Script(OpCode.OP_3, redeem.serializeCmds()));

        return [sut, redeem];
    }

    describe(".sign()", () => {
        it("p2pkh", () => {
            const [sut, prevOut] = createP2PKH();
            const sig = sut.sign(privA, 0, prevOut);
            expect(sig.toString("hex")).to.equal(
                "30450221009fdc678141bfad627023ae38336716543f91c1b12462673bc9d4fddd6cba5f3c02202e8dd9c9ce538c6bc9b29612ccbf07b3051c13e0f40e92ce3e663060da4c803a01",
            );
        });

        it("p2pk", () => {
            const [sut, prevOut] = createP2PK();
            const sig = sut.sign(privA, 0, prevOut);
            expect(sig.toString("hex")).to.equal(
                "3045022100d87f7a819cb6ff3140c5ab0f20def422ae1eaa8aade78c33c2368b6be2609d2b022049581379f827bb08f088591d40f7890526aa17403d3e77d2af411774338de7ce01",
            );
        });
    });

    describe(".serialize()", () => {
        it("spend p2pkh to p2pkh output", () => {
            const [txBuilder, prevOut] = createP2PKH();
            expect(txBuilder.serialize().toString("hex")).to.equal(
                "020000000168de699575d42639235114a0b9b43a6ed3317e72b60601ad9f0a0273ad630e9d000000006b4830450221009fdc678141bfad627023ae38336716543f91c1b12462673bc9d4fddd6cba5f3c02202e8dd9c9ce538c6bc9b29612ccbf07b3051c13e0f40e92ce3e663060da4c803a012102c13bf903d6147a7fec59b450e2e8a6c174c35a11a7675570d10bd05bc3597996ffffffff01f0ca052a010000001976a914c538c517797dfefdf30142dc1684bfd947532dbb88acffffffff",
            );
        });

        it("spend p2pk to p2pk output", () => {
            const [txBuilder, prevOut] = createP2PK();
            expect(txBuilder.serialize().toString("hex")).to.equal(
                "0200000001dcd027d5a637eb38cea5ed896b3efa1c7335357d495fa944ffd73ba63010ce680000000049483045022100d87f7a819cb6ff3140c5ab0f20def422ae1eaa8aade78c33c2368b6be2609d2b022049581379f827bb08f088591d40f7890526aa17403d3e77d2af411774338de7ce01ffffffff01e0a3052a0100000023210334acee9adf0e3e490a422dfe98bc10a8091b43047b793b8d840657b6b6a46c56acffffffff",
            );
        });
        it("spend p2sh-p2pkh to p2sh output", () => {
            const [sut, redeem] = spend_p2sh_p2pkh_to_p2sh();
            expect(sut.serialize().toString("hex")).to.equal(
                "0200000001d9c8b29caba1b353d90fde1f83dc6cf386be147c282e2f2abeb140160cbbe533000000008447304402206cada8b4b6caeadf293627f841244f730aaed74f53709982fd24776643a658d8022026614f756642e08c08b20546f894396187ec1a4ea709a1c69cd036b3ac2f6441012102c13bf903d6147a7fec59b450e2e8a6c174c35a11a7675570d10bd05bc35979961976a9149b40f5b05efd99e4b0c4f62ca63eec3e580e95c788acffffffff01e0a3052a0100000017a9141fec31deece63a911dd9b22fa974ba9760d1bc3d87ffffffff",
            );
        });
        it("spend p2sh to p2sh output", () => {
            const [sut, redeem] = spend_p2sh_to_p2sh();
            expect(sut.serialize().toString("hex")).to.equal(
                "02000000016cc111fe0c8649e6af4c429e0d9c3ae8ffa2bce1929c98340f0839271eb76ba70000000006530457935a87ffffffff01d07c052a0100000017a9149a21dbd362501cd7b7790f1c696c55563a8b602c87ffffffff",
            );
        });
    });
});
