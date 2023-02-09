import * as crypto from "@node-lightning/crypto";
import {
    Script,
    Value,
    TxBuilder,
    bip69OutputSorter,
    LockTime,
    OutPoint,
    Witness,
    HashValue,
    Tx,
} from "@node-lightning/bitcoin";
import { expect } from "chai";
import { TxFactory } from "../../lib/channels/TxFactory";
import { ScriptFactory } from "../../lib/channels/ScriptFactory";
import { Htlc } from "../../lib/domain/Htlc";
import { HtlcDirection } from "../../lib/domain/HtlcDirection";
import { sha256 } from "@node-lightning/crypto";

describe("TxFactory", () => {
    const b = (hex: string) => Buffer.from(hex, "hex");

    describe("#.addFundingOutput", () => {
        it("test vector", () => {
            const privkey = Buffer.from("6bd078650fcee8444e4e09825227b801a1ca928debb750eb36e6d56124bb20e8","hex"); // prettier-ignore
            const pubkey = crypto.getPublicKey(privkey);

            const builder = new TxBuilder();
            builder.addInput("fd2105607605d2302994ffea703b09f66b6351816ee737a93e42a841ea20bbad:0");
            builder.addOutput(Value.fromSats(4989986080), Script.p2wpkhLock(pubkey));

            // add the funding output
            const localPubKey = Buffer.from("023da092f6980e58d2c037173180e9a465476026ee50f96695963e8efe436f54eb", "hex"); // prettier-ignore
            const remotePubKey = Buffer.from("030e9f7b623d2ccc7c9bd44d66d5ce21ce504c0acf6385a132cec6d3c39fa711c1", "hex"); // prettier-ignore
            const fundingSats = Value.fromSats(10000000);
            const fundingOutput = TxFactory.createFundingOutput(
                fundingSats,
                localPubKey,
                remotePubKey,
            );
            builder.addOutput(fundingOutput);
            builder.outputs.sort(bip69OutputSorter);
            builder.locktime = LockTime.zero();

            builder.inputs[0].scriptSig = Script.p2pkhUnlock(
                builder.sign(0, Script.p2pkhLock(pubkey), privkey),
                crypto.getPublicKey(privkey, true),
            ).toScriptBuf();

            // witness_script is:
            // 5221023da092f6980e58d2c037173180e9a465476026ee50f96695963e8efe436f54eb21030e9f7b623d2ccc7c9bd44d66d5ce21ce504c0acf6385a132cec6d3c39fa711c152ae
            // sha256 is:
            expect(fundingOutput.scriptPubKey.serialize().toString("hex")).to.equal(
                "220020c015c4a6be010e21657068fc2e6a9d02b27ebe4d490a25846f7237f104d1a3cd",
            );

            expect(builder.serialize().toString("hex")).to.equal(
                "0200000001adbb20ea41a8423ea937e76e8151636bf6093b70eaff942930d20576600521fd000000006b48304502210090587b6201e166ad6af0227d3036a9454223d49a1f11839c1a362184340ef0240220577f7cd5cca78719405cbf1de7414ac027f0239ef6e214c90fcaab0454d84b3b012103535b32d5eb0a6ed0982a0479bbadc9868d9836f6ba94dd5a63be16d875069184ffffffff028096980000000000220020c015c4a6be010e21657068fc2e6a9d02b27ebe4d490a25846f7237f104d1a3cd20256d29010000001600143ca33c2e4446f4a305f23c80df8ad1afdcf652f900000000",
            );
        });
    });

    describe("#createCommitment", () => {
        it("constructs tx with pruned outputs", () => {
            const localMsat = Value.fromMilliSats(6988000000);
            const remoteMsat = Value.fromMilliSats(3000000000);
            const feePerKw = BigInt(648);

            const localFundingPrivKey =  b("30ff4956bbdd3222d44cc5e8a1261dab1e07957bdac5ae88fe3261ef321f3749"); // prettier-ignore
            const openFundingPubKey = b("023da092f6980e58d2c037173180e9a465476026ee50f96695963e8efe436f54eb"); // prettier-ignore
            const acceptFundingPubKey = b("030e9f7b623d2ccc7c9bd44d66d5ce21ce504c0acf6385a132cec6d3c39fa711c1"); // prettier-ignore
            const localPubKey = b("030d417a46946384f88d5f3337267c5e579765875dc4daca813e21734b140639e7"); // prettier-ignore
            const remotePubKey = b("0394854aa6eab5b2a8122cc726e9dded053a2184d88256816826d6231c068d4a5b"); // prettier-ignore
            const localDelayedPubKey = b("03fd5960528dc152014952efdb702a88f71e3c1653b2314431701ec77e57fde83c"); // prettier-ignore
            const revocationPubKey = b("0212a140cd0c6539d07cd08dfe09984dec3251ea808b892efeac3ede9402bf2b19"); // prettier-ignore
            const localPaymentBasePoint = b("034f355bdcb7cc0af728ef3cceb9615d90684bb5b2ca5f859ab0f0b704075871aa"); // prettier-ignore
            const remotePaymentBasePoint = b("032c0b7cf95324a07d05398b240174dc0c2be444d96b159aa6c7f7b1e668680991"); // prettier-ignore

            const commitmentNumber = 42;
            const fundingOutPoint = OutPoint.fromString("8984484a580b825b9972d7adb15050b3ab624ccd731946b3eeddb92f4e7ef6be:0"); // prettier-ignore
            const fundingSats = Value.fromSats(10000000);
            const localDustLimitSats = Value.fromSats(546);
            const localDelay = 144;

            const htlcs = [
                new Htlc(
                    BigInt(0),
                    HtlcDirection.Accepted,
                    Value.fromMilliSats(1000000),
                    500,
                    sha256(b("0000000000000000000000000000000000000000000000000000000000000000")),
                ),
                new Htlc(
                    BigInt(1),
                    HtlcDirection.Accepted,
                    Value.fromMilliSats(2000000),
                    501,
                    sha256(b("0101010101010101010101010101010101010101010101010101010101010101")),
                ),
                new Htlc(
                    BigInt(0),
                    HtlcDirection.Offered,
                    Value.fromMilliSats(2000000),
                    502,
                    sha256(b("0202020202020202020202020202020202020202020202020202020202020202")),
                ),
                new Htlc(
                    BigInt(1),
                    HtlcDirection.Offered,
                    Value.fromMilliSats(3000000),
                    503,
                    sha256(b("0303030303030303030303030303030303030303030303030303030303030303")),
                ),
                new Htlc(
                    BigInt(2),
                    HtlcDirection.Accepted,
                    Value.fromMilliSats(4000000),
                    504,
                    sha256(b("0404040404040404040404040404040404040404040404040404040404040404")),
                ),
            ];

            const [localTx] = TxFactory.createCommitment(
                true,
                commitmentNumber,
                localPaymentBasePoint,
                remotePaymentBasePoint,
                fundingOutPoint,
                localDustLimitSats,
                feePerKw,
                localDelay,
                localMsat,
                remoteMsat,
                revocationPubKey,
                localDelayedPubKey,
                remotePubKey,
                false,
                localPubKey,
                remotePubKey,
                htlcs,
            );

            const fundingWitnessScript = ScriptFactory.fundingScript(
                openFundingPubKey,
                acceptFundingPubKey,
            );

            const localSig = localTx.signSegWitv0(
                0,
                fundingWitnessScript,
                localFundingPrivKey,
                fundingSats,
            );
            expect(localSig.toString("hex")).to.equal(
                "3045022100a2270d5950c89ae0841233f6efea9c951898b301b2e89e0adbd2c687b9f32efa02207943d90f95b9610458e7c65a576e149750ff3accaacad004cd85e70b235e27de01",
            );
            const remoteSig = Buffer.from(
                "3044022072714e2fbb93cdd1c42eb0828b4f2eff143f717d8f26e79d6ada4f0dcb681bbe02200911be4e5161dd6ebe59ff1c58e1997c4aea804f81db6b698821db6093d7b05701",
                "hex",
            );

            localTx.inputs[0].witness.push(new Witness(Buffer.alloc(0)));
            if (openFundingPubKey.compare(acceptFundingPubKey) < 0) {
                localTx.inputs[0].witness.push(new Witness(localSig));
                localTx.inputs[0].witness.push(new Witness(remoteSig));
            } else {
                localTx.inputs[0].witness.push(new Witness(remoteSig));
                localTx.inputs[0].witness.push(new Witness(localSig));
            }
            localTx.inputs[0].witness.push(new Witness(fundingWitnessScript.serializeCmds()));

            expect(localTx.serialize().toString("hex")).to.equal(
                "02000000000101bef67e4e2fb9ddeeb3461973cd4c62abb35050b1add772995b820b584a488489000000000038b02b8006d007000000000000220020403d394747cae42e98ff01734ad5c08f82ba123d3d9a620abda88989651e2ab5d007000000000000220020748eba944fedc8827f6b06bc44678f93c0f9e6078b35c6331ed31e75f8ce0c2db80b000000000000220020c20b5d1f8584fd90443e7b7b720136174fa4b9333c261d04dbbd012635c0f419a00f0000000000002200208c48d15160397c9731df9bc3b236656efb6665fbfe92b4a6878e88a499f741c4c0c62d0000000000160014ccf1af2f2aabee14bb40fa3851ab2301de8431104e9d6a00000000002200204adb4e2f00643db396dd120d4e7dc17625f5f2c11a40d857accc862d6b7dd80e0400483045022100a2270d5950c89ae0841233f6efea9c951898b301b2e89e0adbd2c687b9f32efa02207943d90f95b9610458e7c65a576e149750ff3accaacad004cd85e70b235e27de01473044022072714e2fbb93cdd1c42eb0828b4f2eff143f717d8f26e79d6ada4f0dcb681bbe02200911be4e5161dd6ebe59ff1c58e1997c4aea804f81db6b698821db6093d7b05701475221023da092f6980e58d2c037173180e9a465476026ee50f96695963e8efe436f54eb21030e9f7b623d2ccc7c9bd44d66d5ce21ce504c0acf6385a132cec6d3c39fa711c152ae3e195220",
            );
        });
    });

    describe("#createHtlcTimeout", () => {
        it("constructs tx", () => {
            const commitmentTx = new HashValue(Buffer.from("8323148ce2419f21ca3d6780053747715832e18ac780931a514b187768882bb6", "hex")); // prettier-ignore
            const index = 1;
            const localPrivKey = b("bb13b121cdc357cd2e608b0aea294afca36e2b34cf958e2e6451a2f274694491"); // prettier-ignore
            const revocationPubKey = b("0212a140cd0c6539d07cd08dfe09984dec3251ea808b892efeac3ede9402bf2b19"); // prettier-ignore
            const delayedPubKey = b("03fd5960528dc152014952efdb702a88f71e3c1653b2314431701ec77e57fde83c"); // prettier-ignore
            const localPubKey = b("030d417a46946384f88d5f3337267c5e579765875dc4daca813e21734b140639e7"); // prettier-ignore
            const remotePubKey = b("0394854aa6eab5b2a8122cc726e9dded053a2184d88256816826d6231c068d4a5b"); // prettier-ignore

            const localDelay = 144;
            const feePerKw = BigInt(647);
            const htlc = new Htlc(
                BigInt(0),
                HtlcDirection.Offered,
                Value.fromMilliSats(2000000),
                502,
                sha256(b("0202020202020202020202020202020202020202020202020202020202020202")),
                b("0202020202020202020202020202020202020202020202020202020202020202"),
            );

            const tx = TxFactory.createHtlcTimeout(
                commitmentTx,
                index,
                localDelay,
                revocationPubKey,
                delayedPubKey,
                feePerKw,
                htlc,
            );

            const witnessScript = ScriptFactory.offeredHtlcScript(
                htlc.paymentHash,
                revocationPubKey,
                localPubKey,
                remotePubKey,
            );

            const localSig = tx.signSegWitv0(0, witnessScript, localPrivKey, htlc.value);
            const remoteSig = b("304402207ceb6678d4db33d2401fdc409959e57c16a6cb97a30261d9c61f29b8c58d34b90220084b4a17b4ca0e86f2d798b3698ca52de5621f2ce86f80bed79afa66874511b001"); // prettier-ignore

            expect(localSig.toString("hex")).to.equal(
                "304402207ff03eb0127fc7c6cae49cc29e2a586b98d1e8969cf4a17dfa50b9c2647720b902205e2ecfda2252956c0ca32f175080e75e4e390e433feb1f8ce9f2ba55648a1dac01",
            );

            tx.inputs[0].witness.push(new Witness(Buffer.alloc(0)));
            tx.inputs[0].witness.push(new Witness(remoteSig));
            tx.inputs[0].witness.push(new Witness(localSig));
            tx.inputs[0].witness.push(new Witness(Buffer.alloc(0)));
            tx.inputs[0].witness.push(new Witness(witnessScript.serializeCmds()));

            expect(tx.serialize().toString("hex")).to.equal(
                "020000000001018323148ce2419f21ca3d6780053747715832e18ac780931a514b187768882bb60100000000000000000124060000000000002200204adb4e2f00643db396dd120d4e7dc17625f5f2c11a40d857accc862d6b7dd80e050047304402207ceb6678d4db33d2401fdc409959e57c16a6cb97a30261d9c61f29b8c58d34b90220084b4a17b4ca0e86f2d798b3698ca52de5621f2ce86f80bed79afa66874511b00147304402207ff03eb0127fc7c6cae49cc29e2a586b98d1e8969cf4a17dfa50b9c2647720b902205e2ecfda2252956c0ca32f175080e75e4e390e433feb1f8ce9f2ba55648a1dac01008576a91414011f7254d96b819c76986c277d115efce6f7b58763ac67210394854aa6eab5b2a8122cc726e9dded053a2184d88256816826d6231c068d4a5b7c820120876475527c21030d417a46946384f88d5f3337267c5e579765875dc4daca813e21734b140639e752ae67a914b43e1b38138a41b37f7cd9a1d274bc63e3a9b5d188ac6868f6010000",
            );
        });
    });

    describe("#createHtlcSuccess", () => {
        it("constructs tx", () => {
            const commitmentTx = new HashValue(Buffer.from("8323148ce2419f21ca3d6780053747715832e18ac780931a514b187768882bb6", "hex")); // prettier-ignore
            const index = 0;
            const localPrivKey = b("bb13b121cdc357cd2e608b0aea294afca36e2b34cf958e2e6451a2f274694491"); // prettier-ignore
            const revocationPubKey = b("0212a140cd0c6539d07cd08dfe09984dec3251ea808b892efeac3ede9402bf2b19"); // prettier-ignore
            const delayedPubKey = b("03fd5960528dc152014952efdb702a88f71e3c1653b2314431701ec77e57fde83c"); // prettier-ignore
            const localPubKey = b("030d417a46946384f88d5f3337267c5e579765875dc4daca813e21734b140639e7"); // prettier-ignore
            const remotePubKey = b("0394854aa6eab5b2a8122cc726e9dded053a2184d88256816826d6231c068d4a5b"); // prettier-ignore

            const localDelay = 144;
            const feePerKw = BigInt(647);
            const htlc = new Htlc(
                BigInt(0),
                HtlcDirection.Accepted,
                Value.fromMilliSats(1000000),
                500,
                sha256(b("0000000000000000000000000000000000000000000000000000000000000000")),
                b("0000000000000000000000000000000000000000000000000000000000000000"),
            );

            const tx = TxFactory.createHtlcSuccess(
                commitmentTx,
                index,
                localDelay,
                revocationPubKey,
                delayedPubKey,
                feePerKw,
                htlc,
            );

            const witnessScript = ScriptFactory.receivedHtlcScript(
                htlc.paymentHash,
                htlc.cltvExpiry,
                revocationPubKey,
                localPubKey,
                remotePubKey,
            );

            const localSig = tx.signSegWitv0(0, witnessScript, localPrivKey, htlc.value);
            const remoteSig = b("30440220385a5afe75632f50128cbb029ee95c80156b5b4744beddc729ad339c9ca432c802202ba5f48550cad3379ac75b9b4fedb86a35baa6947f16ba5037fb8b11ab34374001"); // prettier-ignore

            expect(localSig.toString("hex")).to.equal(
                "304402205999590b8a79fa346e003a68fd40366397119b2b0cdf37b149968d6bc6fbcc4702202b1e1fb5ab7864931caed4e732c359e0fe3d86a548b557be2246efb1708d579a01",
            );

            tx.inputs[0].witness.push(new Witness(Buffer.alloc(0)));
            tx.inputs[0].witness.push(new Witness(remoteSig));
            tx.inputs[0].witness.push(new Witness(localSig));
            tx.inputs[0].witness.push(new Witness(htlc.paymentPreimage));
            tx.inputs[0].witness.push(new Witness(witnessScript.serializeCmds()));

            expect(tx.serialize().toString("hex")).to.equal(
                "020000000001018323148ce2419f21ca3d6780053747715832e18ac780931a514b187768882bb60000000000000000000122020000000000002200204adb4e2f00643db396dd120d4e7dc17625f5f2c11a40d857accc862d6b7dd80e05004730440220385a5afe75632f50128cbb029ee95c80156b5b4744beddc729ad339c9ca432c802202ba5f48550cad3379ac75b9b4fedb86a35baa6947f16ba5037fb8b11ab3437400147304402205999590b8a79fa346e003a68fd40366397119b2b0cdf37b149968d6bc6fbcc4702202b1e1fb5ab7864931caed4e732c359e0fe3d86a548b557be2246efb1708d579a012000000000000000000000000000000000000000000000000000000000000000008a76a91414011f7254d96b819c76986c277d115efce6f7b58763ac67210394854aa6eab5b2a8122cc726e9dded053a2184d88256816826d6231c068d4a5b7c8201208763a914b8bcb07f6344b42ab04250c86a6e8b75d3fdbbc688527c21030d417a46946384f88d5f3337267c5e579765875dc4daca813e21734b140639e752ae677502f401b175ac686800000000",
            );
        });
    });

    describe("BOLT3 Test Vectors", () => {
        const channel = {
            localFundingPrivKey:  b("30ff4956bbdd3222d44cc5e8a1261dab1e07957bdac5ae88fe3261ef321f3749"), // prettier-ignore
            openFundingPubKey: b("023da092f6980e58d2c037173180e9a465476026ee50f96695963e8efe436f54eb"), // prettier-ignore
            acceptFundingPubKey: b("030e9f7b623d2ccc7c9bd44d66d5ce21ce504c0acf6385a132cec6d3c39fa711c1"), // prettier-ignore
            localPrivKey: b("bb13b121cdc357cd2e608b0aea294afca36e2b34cf958e2e6451a2f274694491"), // prettier-ignore
            localPubKey: b("030d417a46946384f88d5f3337267c5e579765875dc4daca813e21734b140639e7"), // prettier-ignore
            remotePubKey: b("0394854aa6eab5b2a8122cc726e9dded053a2184d88256816826d6231c068d4a5b"), // prettier-ignore
            localDelayedPubKey: b("03fd5960528dc152014952efdb702a88f71e3c1653b2314431701ec77e57fde83c"), // prettier-ignore
            revocationPubKey: b("0212a140cd0c6539d07cd08dfe09984dec3251ea808b892efeac3ede9402bf2b19"), // prettier-ignore
            localPaymentBasePoint: b("034f355bdcb7cc0af728ef3cceb9615d90684bb5b2ca5f859ab0f0b704075871aa"), // prettier-ignore
            remotePaymentBasePoint: b("032c0b7cf95324a07d05398b240174dc0c2be444d96b159aa6c7f7b1e668680991"), // prettier-ignore

            commitmentNumber: 42,
            fundingOutPoint: OutPoint.fromString("8984484a580b825b9972d7adb15050b3ab624ccd731946b3eeddb92f4e7ef6be:0"), // prettier-ignore
            fundingSats: Value.fromSats(10000000),
            localDustLimitSats: Value.fromSats(546),
            localDelay: 144,
            htlcs: [
                new Htlc(
                    BigInt(0),
                    HtlcDirection.Accepted,
                    Value.fromMilliSats(1000000),
                    500,
                    sha256(b("0000000000000000000000000000000000000000000000000000000000000000")),
                    b("0000000000000000000000000000000000000000000000000000000000000000"),
                ),
                new Htlc(
                    BigInt(1),
                    HtlcDirection.Accepted,
                    Value.fromMilliSats(2000000),
                    501,
                    sha256(b("0101010101010101010101010101010101010101010101010101010101010101")),
                    b("0101010101010101010101010101010101010101010101010101010101010101"),
                ),
                new Htlc(
                    BigInt(0),
                    HtlcDirection.Offered,
                    Value.fromMilliSats(2000000),
                    502,
                    sha256(b("0202020202020202020202020202020202020202020202020202020202020202")),
                    b("0202020202020202020202020202020202020202020202020202020202020202"),
                ),
                new Htlc(
                    BigInt(1),
                    HtlcDirection.Offered,
                    Value.fromMilliSats(3000000),
                    503,
                    sha256(b("0303030303030303030303030303030303030303030303030303030303030303")),
                    b("0303030303030303030303030303030303030303030303030303030303030303"),
                ),
                new Htlc(
                    BigInt(2),
                    HtlcDirection.Accepted,
                    Value.fromMilliSats(4000000),
                    504,
                    sha256(b("0404040404040404040404040404040404040404040404040404040404040404")),
                    b("0404040404040404040404040404040404040404040404040404040404040404"),
                ),
            ],
        };

        const vectors = [
            {
                "Name": "simple commitment tx with no HTLCs",
                "LocalBalance": 7000000000,
                "RemoteBalance": 3000000000,
                "FeePerKw": 15000,
                "UseTestHtlcs": false,
                "HtlcDescs": [],
                "RemoteSigHex": "3045022100f51d2e566a70ba740fc5d8c0f07b9b93d2ed741c3c0860c613173de7d39e7968022041376d520e9c0e1ad52248ddf4b22e12be8763007df977253ef45a4ca3bdb7c0",
                "LocalSigHex": "3044022051b75c73198c6deee1a875871c3961832909acd297c6b908d59e3319e5185a46022055c419379c5051a78d00dbbce11b5b664a0c22815fbcc6fcef6b1937c3836939",
                "ExpectedCommitmentTxHex": "02000000000101bef67e4e2fb9ddeeb3461973cd4c62abb35050b1add772995b820b584a488489000000000038b02b8002c0c62d0000000000160014ccf1af2f2aabee14bb40fa3851ab2301de84311054a56a00000000002200204adb4e2f00643db396dd120d4e7dc17625f5f2c11a40d857accc862d6b7dd80e0400473044022051b75c73198c6deee1a875871c3961832909acd297c6b908d59e3319e5185a46022055c419379c5051a78d00dbbce11b5b664a0c22815fbcc6fcef6b1937c383693901483045022100f51d2e566a70ba740fc5d8c0f07b9b93d2ed741c3c0860c613173de7d39e7968022041376d520e9c0e1ad52248ddf4b22e12be8763007df977253ef45a4ca3bdb7c001475221023da092f6980e58d2c037173180e9a465476026ee50f96695963e8efe436f54eb21030e9f7b623d2ccc7c9bd44d66d5ce21ce504c0acf6385a132cec6d3c39fa711c152ae3e195220",
            },
            {
                "Name": "commitment tx with all five HTLCs untrimmed (minimum feerate)",
                "LocalBalance": 6988000000,
                "RemoteBalance": 3000000000,
                "FeePerKw": 0,
                "UseTestHtlcs": true,
                "HtlcDescs": [
                    {
                        "RemoteSigHex": "304402206a6e59f18764a5bf8d4fa45eebc591566689441229c918b480fb2af8cc6a4aeb02205248f273be447684b33e3c8d1d85a8e0ca9fa0bae9ae33f0527ada9c162919a6",
                        "LocalSigHex": "304402207cb324fa0de88f452ffa9389678127ebcf4cabe1dd848b8e076c1a1962bf34720220116ed922b12311bd602d67e60d2529917f21c5b82f25ff6506c0f87886b4dfd5",
                        "ResolutionTxHex": "020000000001018154ecccf11a5fb56c39654c4deb4d2296f83c69268280b94d021370c94e219700000000000000000001e8030000000000002200204adb4e2f00643db396dd120d4e7dc17625f5f2c11a40d857accc862d6b7dd80e050047304402206a6e59f18764a5bf8d4fa45eebc591566689441229c918b480fb2af8cc6a4aeb02205248f273be447684b33e3c8d1d85a8e0ca9fa0bae9ae33f0527ada9c162919a60147304402207cb324fa0de88f452ffa9389678127ebcf4cabe1dd848b8e076c1a1962bf34720220116ed922b12311bd602d67e60d2529917f21c5b82f25ff6506c0f87886b4dfd5012000000000000000000000000000000000000000000000000000000000000000008a76a91414011f7254d96b819c76986c277d115efce6f7b58763ac67210394854aa6eab5b2a8122cc726e9dded053a2184d88256816826d6231c068d4a5b7c8201208763a914b8bcb07f6344b42ab04250c86a6e8b75d3fdbbc688527c21030d417a46946384f88d5f3337267c5e579765875dc4daca813e21734b140639e752ae677502f401b175ac686800000000"
                    },
                    {
                        "RemoteSigHex": "3045022100d5275b3619953cb0c3b5aa577f04bc512380e60fa551762ce3d7a1bb7401cff9022037237ab0dac3fe100cde094e82e2bed9ba0ed1bb40154b48e56aa70f259e608b",
                        "LocalSigHex": "3045022100c89172099507ff50f4c925e6c5150e871fb6e83dd73ff9fbb72f6ce829a9633f02203a63821d9162e99f9be712a68f9e589483994feae2661e4546cd5b6cec007be5",
                        "ResolutionTxHex": "020000000001018154ecccf11a5fb56c39654c4deb4d2296f83c69268280b94d021370c94e219701000000000000000001d0070000000000002200204adb4e2f00643db396dd120d4e7dc17625f5f2c11a40d857accc862d6b7dd80e0500483045022100d5275b3619953cb0c3b5aa577f04bc512380e60fa551762ce3d7a1bb7401cff9022037237ab0dac3fe100cde094e82e2bed9ba0ed1bb40154b48e56aa70f259e608b01483045022100c89172099507ff50f4c925e6c5150e871fb6e83dd73ff9fbb72f6ce829a9633f02203a63821d9162e99f9be712a68f9e589483994feae2661e4546cd5b6cec007be501008576a91414011f7254d96b819c76986c277d115efce6f7b58763ac67210394854aa6eab5b2a8122cc726e9dded053a2184d88256816826d6231c068d4a5b7c820120876475527c21030d417a46946384f88d5f3337267c5e579765875dc4daca813e21734b140639e752ae67a914b43e1b38138a41b37f7cd9a1d274bc63e3a9b5d188ac6868f6010000"
                    },
                    {
                        "RemoteSigHex": "304402201b63ec807771baf4fdff523c644080de17f1da478989308ad13a58b51db91d360220568939d38c9ce295adba15665fa68f51d967e8ed14a007b751540a80b325f202",
                        "LocalSigHex": "3045022100def389deab09cee69eaa1ec14d9428770e45bcbe9feb46468ecf481371165c2f022015d2e3c46600b2ebba8dcc899768874cc6851fd1ecb3fffd15db1cc3de7e10da",
                        "ResolutionTxHex": "020000000001018154ecccf11a5fb56c39654c4deb4d2296f83c69268280b94d021370c94e219702000000000000000001d0070000000000002200204adb4e2f00643db396dd120d4e7dc17625f5f2c11a40d857accc862d6b7dd80e050047304402201b63ec807771baf4fdff523c644080de17f1da478989308ad13a58b51db91d360220568939d38c9ce295adba15665fa68f51d967e8ed14a007b751540a80b325f20201483045022100def389deab09cee69eaa1ec14d9428770e45bcbe9feb46468ecf481371165c2f022015d2e3c46600b2ebba8dcc899768874cc6851fd1ecb3fffd15db1cc3de7e10da012001010101010101010101010101010101010101010101010101010101010101018a76a91414011f7254d96b819c76986c277d115efce6f7b58763ac67210394854aa6eab5b2a8122cc726e9dded053a2184d88256816826d6231c068d4a5b7c8201208763a9144b6b2e5444c2639cc0fb7bcea5afba3f3cdce23988527c21030d417a46946384f88d5f3337267c5e579765875dc4daca813e21734b140639e752ae677502f501b175ac686800000000"
                    },
                    {
                        "RemoteSigHex": "3045022100daee1808f9861b6c3ecd14f7b707eca02dd6bdfc714ba2f33bc8cdba507bb182022026654bf8863af77d74f51f4e0b62d461a019561bb12acb120d3f7195d148a554",
                        "LocalSigHex": "30440220643aacb19bbb72bd2b635bc3f7375481f5981bace78cdd8319b2988ffcc6704202203d27784ec8ad51ed3bd517a05525a5139bb0b755dd719e0054332d186ac08727",
                        "ResolutionTxHex": "020000000001018154ecccf11a5fb56c39654c4deb4d2296f83c69268280b94d021370c94e219703000000000000000001b80b0000000000002200204adb4e2f00643db396dd120d4e7dc17625f5f2c11a40d857accc862d6b7dd80e0500483045022100daee1808f9861b6c3ecd14f7b707eca02dd6bdfc714ba2f33bc8cdba507bb182022026654bf8863af77d74f51f4e0b62d461a019561bb12acb120d3f7195d148a554014730440220643aacb19bbb72bd2b635bc3f7375481f5981bace78cdd8319b2988ffcc6704202203d27784ec8ad51ed3bd517a05525a5139bb0b755dd719e0054332d186ac0872701008576a91414011f7254d96b819c76986c277d115efce6f7b58763ac67210394854aa6eab5b2a8122cc726e9dded053a2184d88256816826d6231c068d4a5b7c820120876475527c21030d417a46946384f88d5f3337267c5e579765875dc4daca813e21734b140639e752ae67a9148a486ff2e31d6158bf39e2608864d63fefd09d5b88ac6868f7010000"
                    },
                    {
                        "RemoteSigHex": "304402207e0410e45454b0978a623f36a10626ef17b27d9ad44e2760f98cfa3efb37924f0220220bd8acd43ecaa916a80bd4f919c495a2c58982ce7c8625153f8596692a801d",
                        "LocalSigHex": "30440220549e80b4496803cbc4a1d09d46df50109f546d43fbbf86cd90b174b1484acd5402205f12a4f995cb9bded597eabfee195a285986aa6d93ae5bb72507ebc6a4e2349e",
                        "ResolutionTxHex": "020000000001018154ecccf11a5fb56c39654c4deb4d2296f83c69268280b94d021370c94e219704000000000000000001a00f0000000000002200204adb4e2f00643db396dd120d4e7dc17625f5f2c11a40d857accc862d6b7dd80e050047304402207e0410e45454b0978a623f36a10626ef17b27d9ad44e2760f98cfa3efb37924f0220220bd8acd43ecaa916a80bd4f919c495a2c58982ce7c8625153f8596692a801d014730440220549e80b4496803cbc4a1d09d46df50109f546d43fbbf86cd90b174b1484acd5402205f12a4f995cb9bded597eabfee195a285986aa6d93ae5bb72507ebc6a4e2349e012004040404040404040404040404040404040404040404040404040404040404048a76a91414011f7254d96b819c76986c277d115efce6f7b58763ac67210394854aa6eab5b2a8122cc726e9dded053a2184d88256816826d6231c068d4a5b7c8201208763a91418bc1a114ccf9c052d3d23e28d3b0a9d1227434288527c21030d417a46946384f88d5f3337267c5e579765875dc4daca813e21734b140639e752ae677502f801b175ac686800000000"
                    },
                ],
                "RemoteSigHex": "304402204fd4928835db1ccdfc40f5c78ce9bd65249b16348df81f0c44328dcdefc97d630220194d3869c38bc732dd87d13d2958015e2fc16829e74cd4377f84d215c0b70606",
                "LocalSigHex": "30440220275b0c325a5e9355650dc30c0eccfbc7efb23987c24b556b9dfdd40effca18d202206caceb2c067836c51f296740c7ae807ffcbfbf1dd3a0d56b6de9a5b247985f06",
                "ExpectedCommitmentTxHex": "02000000000101bef67e4e2fb9ddeeb3461973cd4c62abb35050b1add772995b820b584a488489000000000038b02b8007e80300000000000022002052bfef0479d7b293c27e0f1eb294bea154c63a3294ef092c19af51409bce0e2ad007000000000000220020403d394747cae42e98ff01734ad5c08f82ba123d3d9a620abda88989651e2ab5d007000000000000220020748eba944fedc8827f6b06bc44678f93c0f9e6078b35c6331ed31e75f8ce0c2db80b000000000000220020c20b5d1f8584fd90443e7b7b720136174fa4b9333c261d04dbbd012635c0f419a00f0000000000002200208c48d15160397c9731df9bc3b236656efb6665fbfe92b4a6878e88a499f741c4c0c62d0000000000160014ccf1af2f2aabee14bb40fa3851ab2301de843110e0a06a00000000002200204adb4e2f00643db396dd120d4e7dc17625f5f2c11a40d857accc862d6b7dd80e04004730440220275b0c325a5e9355650dc30c0eccfbc7efb23987c24b556b9dfdd40effca18d202206caceb2c067836c51f296740c7ae807ffcbfbf1dd3a0d56b6de9a5b247985f060147304402204fd4928835db1ccdfc40f5c78ce9bd65249b16348df81f0c44328dcdefc97d630220194d3869c38bc732dd87d13d2958015e2fc16829e74cd4377f84d215c0b7060601475221023da092f6980e58d2c037173180e9a465476026ee50f96695963e8efe436f54eb21030e9f7b623d2ccc7c9bd44d66d5ce21ce504c0acf6385a132cec6d3c39fa711c152ae3e195220",
            },
            {
                "Name": "commitment tx with seven outputs untrimmed (maximum feerate)",
                "LocalBalance": 6988000000,
                "RemoteBalance": 3000000000,
                "FeePerKw": 647,
                "UseTestHtlcs": true,
                "HtlcDescs": [
                    {
                        "RemoteSigHex": "30440220385a5afe75632f50128cbb029ee95c80156b5b4744beddc729ad339c9ca432c802202ba5f48550cad3379ac75b9b4fedb86a35baa6947f16ba5037fb8b11ab343740",
                        "LocalSigHex": "304402205999590b8a79fa346e003a68fd40366397119b2b0cdf37b149968d6bc6fbcc4702202b1e1fb5ab7864931caed4e732c359e0fe3d86a548b557be2246efb1708d579a",
                        "ResolutionTxHex": "020000000001018323148ce2419f21ca3d6780053747715832e18ac780931a514b187768882bb60000000000000000000122020000000000002200204adb4e2f00643db396dd120d4e7dc17625f5f2c11a40d857accc862d6b7dd80e05004730440220385a5afe75632f50128cbb029ee95c80156b5b4744beddc729ad339c9ca432c802202ba5f48550cad3379ac75b9b4fedb86a35baa6947f16ba5037fb8b11ab3437400147304402205999590b8a79fa346e003a68fd40366397119b2b0cdf37b149968d6bc6fbcc4702202b1e1fb5ab7864931caed4e732c359e0fe3d86a548b557be2246efb1708d579a012000000000000000000000000000000000000000000000000000000000000000008a76a91414011f7254d96b819c76986c277d115efce6f7b58763ac67210394854aa6eab5b2a8122cc726e9dded053a2184d88256816826d6231c068d4a5b7c8201208763a914b8bcb07f6344b42ab04250c86a6e8b75d3fdbbc688527c21030d417a46946384f88d5f3337267c5e579765875dc4daca813e21734b140639e752ae677502f401b175ac686800000000"
                    },
                    {
                        "RemoteSigHex": "304402207ceb6678d4db33d2401fdc409959e57c16a6cb97a30261d9c61f29b8c58d34b90220084b4a17b4ca0e86f2d798b3698ca52de5621f2ce86f80bed79afa66874511b0",
                        "LocalSigHex": "020000000001018323148ce2419f21ca3d6780053747715832e18ac780931a514b187768882bb60000000000000000000122020000000000002200204adb4e2f00643db396dd120d4e7dc17625f5f2c11a40d857accc862d6b7dd80e05004730440220385a5afe75632f50128cbb029ee95c80156b5b4744beddc729ad339c9ca432c802202ba5f48550cad3379ac75b9b4fedb86a35baa6947f16ba5037fb8b11ab3437400147304402205999590b8a79fa346e003a68fd40366397119b2b0cdf37b149968d6bc6fbcc4702202b1e1fb5ab7864931caed4e732c359e0fe3d86a548b557be2246efb1708d579a012000000000000000000000000000000000000000000000000000000000000000008a76a91414011f7254d96b819c76986c277d115efce6f7b58763ac67210394854aa6eab5b2a8122cc726e9dded053a2184d88256816826d6231c068d4a5b7c8201208763a914b8bcb07f6344b42ab04250c86a6e8b75d3fdbbc688527c21030d417a46946384f88d5f3337267c5e579765875dc4daca813e21734b140639e752ae677502f401b175ac686800000000",
                        "ResolutionTxHex": "020000000001018323148ce2419f21ca3d6780053747715832e18ac780931a514b187768882bb60100000000000000000124060000000000002200204adb4e2f00643db396dd120d4e7dc17625f5f2c11a40d857accc862d6b7dd80e050047304402207ceb6678d4db33d2401fdc409959e57c16a6cb97a30261d9c61f29b8c58d34b90220084b4a17b4ca0e86f2d798b3698ca52de5621f2ce86f80bed79afa66874511b00147304402207ff03eb0127fc7c6cae49cc29e2a586b98d1e8969cf4a17dfa50b9c2647720b902205e2ecfda2252956c0ca32f175080e75e4e390e433feb1f8ce9f2ba55648a1dac01008576a91414011f7254d96b819c76986c277d115efce6f7b58763ac67210394854aa6eab5b2a8122cc726e9dded053a2184d88256816826d6231c068d4a5b7c820120876475527c21030d417a46946384f88d5f3337267c5e579765875dc4daca813e21734b140639e752ae67a914b43e1b38138a41b37f7cd9a1d274bc63e3a9b5d188ac6868f6010000"
                    },
                    {
                        "RemoteSigHex": "304402206a401b29a0dff0d18ec903502c13d83e7ec019450113f4a7655a4ce40d1f65ba0220217723a084e727b6ca0cc8b6c69c014a7e4a01fcdcba3e3993f462a3c574d833",
                        "LocalSigHex": "3045022100d50d067ca625d54e62df533a8f9291736678d0b86c28a61bb2a80cf42e702d6e02202373dde7e00218eacdafb9415fe0e1071beec1857d1af3c6a201a44cbc47c877",
                        "ResolutionTxHex": "020000000001018323148ce2419f21ca3d6780053747715832e18ac780931a514b187768882bb6020000000000000000010a060000000000002200204adb4e2f00643db396dd120d4e7dc17625f5f2c11a40d857accc862d6b7dd80e050047304402206a401b29a0dff0d18ec903502c13d83e7ec019450113f4a7655a4ce40d1f65ba0220217723a084e727b6ca0cc8b6c69c014a7e4a01fcdcba3e3993f462a3c574d83301483045022100d50d067ca625d54e62df533a8f9291736678d0b86c28a61bb2a80cf42e702d6e02202373dde7e00218eacdafb9415fe0e1071beec1857d1af3c6a201a44cbc47c877012001010101010101010101010101010101010101010101010101010101010101018a76a91414011f7254d96b819c76986c277d115efce6f7b58763ac67210394854aa6eab5b2a8122cc726e9dded053a2184d88256816826d6231c068d4a5b7c8201208763a9144b6b2e5444c2639cc0fb7bcea5afba3f3cdce23988527c21030d417a46946384f88d5f3337267c5e579765875dc4daca813e21734b140639e752ae677502f501b175ac686800000000"
                    },
                    {
                        "RemoteSigHex": "30450221009b1c987ba599ee3bde1dbca776b85481d70a78b681a8d84206723e2795c7cac002207aac84ad910f8598c4d1c0ea2e3399cf6627a4e3e90131315bc9f038451ce39d",
                        "LocalSigHex": "3045022100db9dc65291077a52728c622987e9895b7241d4394d6dcb916d7600a3e8728c22022036ee3ee717ba0bb5c45ee84bc7bbf85c0f90f26ae4e4a25a6b4241afa8a3f1cb",
                        "ResolutionTxHex": "020000000001018323148ce2419f21ca3d6780053747715832e18ac780931a514b187768882bb6030000000000000000010c0a0000000000002200204adb4e2f00643db396dd120d4e7dc17625f5f2c11a40d857accc862d6b7dd80e05004830450221009b1c987ba599ee3bde1dbca776b85481d70a78b681a8d84206723e2795c7cac002207aac84ad910f8598c4d1c0ea2e3399cf6627a4e3e90131315bc9f038451ce39d01483045022100db9dc65291077a52728c622987e9895b7241d4394d6dcb916d7600a3e8728c22022036ee3ee717ba0bb5c45ee84bc7bbf85c0f90f26ae4e4a25a6b4241afa8a3f1cb01008576a91414011f7254d96b819c76986c277d115efce6f7b58763ac67210394854aa6eab5b2a8122cc726e9dded053a2184d88256816826d6231c068d4a5b7c820120876475527c21030d417a46946384f88d5f3337267c5e579765875dc4daca813e21734b140639e752ae67a9148a486ff2e31d6158bf39e2608864d63fefd09d5b88ac6868f7010000"
                    },
                    {
                        "RemoteSigHex": "3045022100cc28030b59f0914f45b84caa983b6f8effa900c952310708c2b5b00781117022022027ba2ccdf94d03c6d48b327f183f6e28c8a214d089b9227f94ac4f85315274f0",
                        "LocalSigHex": "304402202d1a3c0d31200265d2a2def2753ead4959ae20b4083e19553acfffa5dfab60bf022020ede134149504e15b88ab261a066de49848411e15e70f9e6a5462aec2949f8f",
                        "ResolutionTxHex": "020000000001018323148ce2419f21ca3d6780053747715832e18ac780931a514b187768882bb604000000000000000001da0d0000000000002200204adb4e2f00643db396dd120d4e7dc17625f5f2c11a40d857accc862d6b7dd80e0500483045022100cc28030b59f0914f45b84caa983b6f8effa900c952310708c2b5b00781117022022027ba2ccdf94d03c6d48b327f183f6e28c8a214d089b9227f94ac4f85315274f00147304402202d1a3c0d31200265d2a2def2753ead4959ae20b4083e19553acfffa5dfab60bf022020ede134149504e15b88ab261a066de49848411e15e70f9e6a5462aec2949f8f012004040404040404040404040404040404040404040404040404040404040404048a76a91414011f7254d96b819c76986c277d115efce6f7b58763ac67210394854aa6eab5b2a8122cc726e9dded053a2184d88256816826d6231c068d4a5b7c8201208763a91418bc1a114ccf9c052d3d23e28d3b0a9d1227434288527c21030d417a46946384f88d5f3337267c5e579765875dc4daca813e21734b140639e752ae677502f801b175ac686800000000"
                    },
                ],
                "RemoteSigHex": "3045022100a5c01383d3ec646d97e40f44318d49def817fcd61a0ef18008a665b3e151785502203e648efddd5838981ef55ec954be69c4a652d021e6081a100d034de366815e9b",
                "LocalSigHex": "304502210094bfd8f5572ac0157ec76a9551b6c5216a4538c07cd13a51af4a54cb26fa14320220768efce8ce6f4a5efac875142ff19237c011343670adf9c7ac69704a120d1163",
                "ExpectedCommitmentTxHex": "02000000000101bef67e4e2fb9ddeeb3461973cd4c62abb35050b1add772995b820b584a488489000000000038b02b8007e80300000000000022002052bfef0479d7b293c27e0f1eb294bea154c63a3294ef092c19af51409bce0e2ad007000000000000220020403d394747cae42e98ff01734ad5c08f82ba123d3d9a620abda88989651e2ab5d007000000000000220020748eba944fedc8827f6b06bc44678f93c0f9e6078b35c6331ed31e75f8ce0c2db80b000000000000220020c20b5d1f8584fd90443e7b7b720136174fa4b9333c261d04dbbd012635c0f419a00f0000000000002200208c48d15160397c9731df9bc3b236656efb6665fbfe92b4a6878e88a499f741c4c0c62d0000000000160014ccf1af2f2aabee14bb40fa3851ab2301de843110e09c6a00000000002200204adb4e2f00643db396dd120d4e7dc17625f5f2c11a40d857accc862d6b7dd80e040048304502210094bfd8f5572ac0157ec76a9551b6c5216a4538c07cd13a51af4a54cb26fa14320220768efce8ce6f4a5efac875142ff19237c011343670adf9c7ac69704a120d116301483045022100a5c01383d3ec646d97e40f44318d49def817fcd61a0ef18008a665b3e151785502203e648efddd5838981ef55ec954be69c4a652d021e6081a100d034de366815e9b01475221023da092f6980e58d2c037173180e9a465476026ee50f96695963e8efe436f54eb21030e9f7b623d2ccc7c9bd44d66d5ce21ce504c0acf6385a132cec6d3c39fa711c152ae3e195220",
            },
            {
                "Name": "commitment tx with six outputs untrimmed (minimum feerate)",
                "LocalBalance": 6988000000,
                "RemoteBalance": 3000000000,
                "FeePerKw": 648,
                "UseTestHtlcs": true,
                "HtlcDescs": [
                    {
                        "RemoteSigHex": "3044022062ef2e77591409d60d7817d9bb1e71d3c4a2931d1a6c7c8307422c84f001a251022022dad9726b0ae3fe92bda745a06f2c00f92342a186d84518588cf65f4dfaada8",
                        "LocalSigHex": "3045022100a4c574f00411dd2f978ca5cdc1b848c311cd7849c087ad2f21a5bce5e8cc5ae90220090ae39a9bce2fb8bc879d7e9f9022df249f41e25e51f1a9bf6447a9eeffc098",
                        "ResolutionTxHex": "02000000000101579c183eca9e8236a5d7f5dcd79cfec32c497fdc0ec61533cde99ecd436cadd10000000000000000000123060000000000002200204adb4e2f00643db396dd120d4e7dc17625f5f2c11a40d857accc862d6b7dd80e0500473044022062ef2e77591409d60d7817d9bb1e71d3c4a2931d1a6c7c8307422c84f001a251022022dad9726b0ae3fe92bda745a06f2c00f92342a186d84518588cf65f4dfaada801483045022100a4c574f00411dd2f978ca5cdc1b848c311cd7849c087ad2f21a5bce5e8cc5ae90220090ae39a9bce2fb8bc879d7e9f9022df249f41e25e51f1a9bf6447a9eeffc09801008576a91414011f7254d96b819c76986c277d115efce6f7b58763ac67210394854aa6eab5b2a8122cc726e9dded053a2184d88256816826d6231c068d4a5b7c820120876475527c21030d417a46946384f88d5f3337267c5e579765875dc4daca813e21734b140639e752ae67a914b43e1b38138a41b37f7cd9a1d274bc63e3a9b5d188ac6868f6010000"
                    },
                    {
                        "RemoteSigHex": "3045022100e968cbbb5f402ed389fdc7f6cd2a80ed650bb42c79aeb2a5678444af94f6c78502204b47a1cb24ab5b0b6fe69fe9cfc7dba07b9dd0d8b95f372c1d9435146a88f8d4",
                        "LocalSigHex": "304402207679cf19790bea76a733d2fa0672bd43ab455687a068f815a3d237581f57139a0220683a1a799e102071c206b207735ca80f627ab83d6616b4bcd017c5d79ef3e7d0",
                        "ResolutionTxHex": "02000000000101579c183eca9e8236a5d7f5dcd79cfec32c497fdc0ec61533cde99ecd436cadd10100000000000000000109060000000000002200204adb4e2f00643db396dd120d4e7dc17625f5f2c11a40d857accc862d6b7dd80e0500483045022100e968cbbb5f402ed389fdc7f6cd2a80ed650bb42c79aeb2a5678444af94f6c78502204b47a1cb24ab5b0b6fe69fe9cfc7dba07b9dd0d8b95f372c1d9435146a88f8d40147304402207679cf19790bea76a733d2fa0672bd43ab455687a068f815a3d237581f57139a0220683a1a799e102071c206b207735ca80f627ab83d6616b4bcd017c5d79ef3e7d0012001010101010101010101010101010101010101010101010101010101010101018a76a91414011f7254d96b819c76986c277d115efce6f7b58763ac67210394854aa6eab5b2a8122cc726e9dded053a2184d88256816826d6231c068d4a5b7c8201208763a9144b6b2e5444c2639cc0fb7bcea5afba3f3cdce23988527c21030d417a46946384f88d5f3337267c5e579765875dc4daca813e21734b140639e752ae677502f501b175ac686800000000"
                    },
                    {
                        "RemoteSigHex": "3045022100aa91932e305292cf9969cc23502bbf6cef83a5df39c95ad04a707c4f4fed5c7702207099fc0f3a9bfe1e7683c0e9aa5e76c5432eb20693bf4cb182f04d383dc9c8c2",
                        "LocalSigHex": "304402200df76fea718745f3c529bac7fd37923e7309ce38b25c0781e4cf514dd9ef8dc802204172295739dbae9fe0474dcee3608e3433b4b2af3a2e6787108b02f894dcdda3",
                        "ResolutionTxHex": "02000000000101579c183eca9e8236a5d7f5dcd79cfec32c497fdc0ec61533cde99ecd436cadd1020000000000000000010b0a0000000000002200204adb4e2f00643db396dd120d4e7dc17625f5f2c11a40d857accc862d6b7dd80e0500483045022100aa91932e305292cf9969cc23502bbf6cef83a5df39c95ad04a707c4f4fed5c7702207099fc0f3a9bfe1e7683c0e9aa5e76c5432eb20693bf4cb182f04d383dc9c8c20147304402200df76fea718745f3c529bac7fd37923e7309ce38b25c0781e4cf514dd9ef8dc802204172295739dbae9fe0474dcee3608e3433b4b2af3a2e6787108b02f894dcdda301008576a91414011f7254d96b819c76986c277d115efce6f7b58763ac67210394854aa6eab5b2a8122cc726e9dded053a2184d88256816826d6231c068d4a5b7c820120876475527c21030d417a46946384f88d5f3337267c5e579765875dc4daca813e21734b140639e752ae67a9148a486ff2e31d6158bf39e2608864d63fefd09d5b88ac6868f7010000"
                    },
                    {
                        "RemoteSigHex": "3044022035cac88040a5bba420b1c4257235d5015309113460bc33f2853cd81ca36e632402202fc94fd3e81e9d34a9d01782a0284f3044370d03d60f3fc041e2da088d2de58f",
                        "LocalSigHex": "304402200daf2eb7afd355b4caf6fb08387b5f031940ea29d1a9f35071288a839c9039e4022067201b562456e7948616c13acb876b386b511599b58ac1d94d127f91c50463a6",
                        "ResolutionTxHex": "02000000000101579c183eca9e8236a5d7f5dcd79cfec32c497fdc0ec61533cde99ecd436cadd103000000000000000001d90d0000000000002200204adb4e2f00643db396dd120d4e7dc17625f5f2c11a40d857accc862d6b7dd80e0500473044022035cac88040a5bba420b1c4257235d5015309113460bc33f2853cd81ca36e632402202fc94fd3e81e9d34a9d01782a0284f3044370d03d60f3fc041e2da088d2de58f0147304402200daf2eb7afd355b4caf6fb08387b5f031940ea29d1a9f35071288a839c9039e4022067201b562456e7948616c13acb876b386b511599b58ac1d94d127f91c50463a6012004040404040404040404040404040404040404040404040404040404040404048a76a91414011f7254d96b819c76986c277d115efce6f7b58763ac67210394854aa6eab5b2a8122cc726e9dded053a2184d88256816826d6231c068d4a5b7c8201208763a91418bc1a114ccf9c052d3d23e28d3b0a9d1227434288527c21030d417a46946384f88d5f3337267c5e579765875dc4daca813e21734b140639e752ae677502f801b175ac686800000000"
                    },
                ],
                "RemoteSigHex": "3044022072714e2fbb93cdd1c42eb0828b4f2eff143f717d8f26e79d6ada4f0dcb681bbe02200911be4e5161dd6ebe59ff1c58e1997c4aea804f81db6b698821db6093d7b057",
                "LocalSigHex": "3045022100a2270d5950c89ae0841233f6efea9c951898b301b2e89e0adbd2c687b9f32efa02207943d90f95b9610458e7c65a576e149750ff3accaacad004cd85e70b235e27de",
                "ExpectedCommitmentTxHex": "02000000000101bef67e4e2fb9ddeeb3461973cd4c62abb35050b1add772995b820b584a488489000000000038b02b8006d007000000000000220020403d394747cae42e98ff01734ad5c08f82ba123d3d9a620abda88989651e2ab5d007000000000000220020748eba944fedc8827f6b06bc44678f93c0f9e6078b35c6331ed31e75f8ce0c2db80b000000000000220020c20b5d1f8584fd90443e7b7b720136174fa4b9333c261d04dbbd012635c0f419a00f0000000000002200208c48d15160397c9731df9bc3b236656efb6665fbfe92b4a6878e88a499f741c4c0c62d0000000000160014ccf1af2f2aabee14bb40fa3851ab2301de8431104e9d6a00000000002200204adb4e2f00643db396dd120d4e7dc17625f5f2c11a40d857accc862d6b7dd80e0400483045022100a2270d5950c89ae0841233f6efea9c951898b301b2e89e0adbd2c687b9f32efa02207943d90f95b9610458e7c65a576e149750ff3accaacad004cd85e70b235e27de01473044022072714e2fbb93cdd1c42eb0828b4f2eff143f717d8f26e79d6ada4f0dcb681bbe02200911be4e5161dd6ebe59ff1c58e1997c4aea804f81db6b698821db6093d7b05701475221023da092f6980e58d2c037173180e9a465476026ee50f96695963e8efe436f54eb21030e9f7b623d2ccc7c9bd44d66d5ce21ce504c0acf6385a132cec6d3c39fa711c152ae3e195220",
            },
            {
                "Name": "commitment tx with six outputs untrimmed (maximum feerate)",
                "LocalBalance": 6988000000,
                "RemoteBalance": 3000000000,
                "FeePerKw": 2069,
                "UseTestHtlcs": true,
                "HtlcDescs": [
                    {
                        "RemoteSigHex": "3045022100d1cf354de41c1369336cf85b225ed033f1f8982a01be503668df756a7e668b66022001254144fb4d0eecc61908fccc3388891ba17c5d7a1a8c62bdd307e5a513f992",
                        "LocalSigHex": "3044022056eb1af429660e45a1b0b66568cb8c4a3aa7e4c9c292d5d6c47f86ebf2c8838f022065c3ac4ebe980ca7a41148569be4ad8751b0a724a41405697ec55035dae66402",
                        "ResolutionTxHex": "02000000000101ca94a9ad516ebc0c4bdd7b6254871babfa978d5accafb554214137d398bfcf6a0000000000000000000175020000000000002200204adb4e2f00643db396dd120d4e7dc17625f5f2c11a40d857accc862d6b7dd80e0500483045022100d1cf354de41c1369336cf85b225ed033f1f8982a01be503668df756a7e668b66022001254144fb4d0eecc61908fccc3388891ba17c5d7a1a8c62bdd307e5a513f99201473044022056eb1af429660e45a1b0b66568cb8c4a3aa7e4c9c292d5d6c47f86ebf2c8838f022065c3ac4ebe980ca7a41148569be4ad8751b0a724a41405697ec55035dae6640201008576a91414011f7254d96b819c76986c277d115efce6f7b58763ac67210394854aa6eab5b2a8122cc726e9dded053a2184d88256816826d6231c068d4a5b7c820120876475527c21030d417a46946384f88d5f3337267c5e579765875dc4daca813e21734b140639e752ae67a914b43e1b38138a41b37f7cd9a1d274bc63e3a9b5d188ac6868f6010000"
                    },
                    {
                        "RemoteSigHex": "3045022100d065569dcb94f090345402736385efeb8ea265131804beac06dd84d15dd2d6880220664feb0b4b2eb985fadb6ec7dc58c9334ea88ce599a9be760554a2d4b3b5d9f4",
                        "LocalSigHex": "3045022100914bb232cd4b2690ee3d6cb8c3713c4ac9c4fb925323068d8b07f67c8541f8d9022057152f5f1615b793d2d45aac7518989ae4fe970f28b9b5c77504799d25433f7f",
                        "ResolutionTxHex": "02000000000101ca94a9ad516ebc0c4bdd7b6254871babfa978d5accafb554214137d398bfcf6a0100000000000000000122020000000000002200204adb4e2f00643db396dd120d4e7dc17625f5f2c11a40d857accc862d6b7dd80e0500483045022100d065569dcb94f090345402736385efeb8ea265131804beac06dd84d15dd2d6880220664feb0b4b2eb985fadb6ec7dc58c9334ea88ce599a9be760554a2d4b3b5d9f401483045022100914bb232cd4b2690ee3d6cb8c3713c4ac9c4fb925323068d8b07f67c8541f8d9022057152f5f1615b793d2d45aac7518989ae4fe970f28b9b5c77504799d25433f7f012001010101010101010101010101010101010101010101010101010101010101018a76a91414011f7254d96b819c76986c277d115efce6f7b58763ac67210394854aa6eab5b2a8122cc726e9dded053a2184d88256816826d6231c068d4a5b7c8201208763a9144b6b2e5444c2639cc0fb7bcea5afba3f3cdce23988527c21030d417a46946384f88d5f3337267c5e579765875dc4daca813e21734b140639e752ae677502f501b175ac686800000000"
                    },
                    {
                        "RemoteSigHex": "3045022100d4e69d363de993684eae7b37853c40722a4c1b4a7b588ad7b5d8a9b5006137a102207a069c628170ee34be5612747051bdcc087466dbaa68d5756ea81c10155aef18",
                        "LocalSigHex": "304402200e362443f7af830b419771e8e1614fc391db3a4eb799989abfc5ab26d6fcd032022039ab0cad1c14dfbe9446bf847965e56fe016e0cbcf719fd18c1bfbf53ecbd9f9",
                        "ResolutionTxHex": "02000000000101ca94a9ad516ebc0c4bdd7b6254871babfa978d5accafb554214137d398bfcf6a020000000000000000015d060000000000002200204adb4e2f00643db396dd120d4e7dc17625f5f2c11a40d857accc862d6b7dd80e0500483045022100d4e69d363de993684eae7b37853c40722a4c1b4a7b588ad7b5d8a9b5006137a102207a069c628170ee34be5612747051bdcc087466dbaa68d5756ea81c10155aef180147304402200e362443f7af830b419771e8e1614fc391db3a4eb799989abfc5ab26d6fcd032022039ab0cad1c14dfbe9446bf847965e56fe016e0cbcf719fd18c1bfbf53ecbd9f901008576a91414011f7254d96b819c76986c277d115efce6f7b58763ac67210394854aa6eab5b2a8122cc726e9dded053a2184d88256816826d6231c068d4a5b7c820120876475527c21030d417a46946384f88d5f3337267c5e579765875dc4daca813e21734b140639e752ae67a9148a486ff2e31d6158bf39e2608864d63fefd09d5b88ac6868f7010000"
                    },
                    {
                        "RemoteSigHex": "30450221008ec888e36e4a4b3dc2ed6b823319855b2ae03006ca6ae0d9aa7e24bfc1d6f07102203b0f78885472a67ff4fe5916c0bb669487d659527509516fc3a08e87a2cc0a7c",
                        "LocalSigHex": "304402202c3e14282b84b02705dfd00a6da396c9fe8a8bcb1d3fdb4b20a4feba09440e8b02202b058b39aa9b0c865b22095edcd9ff1f71bbfe20aa4993755e54d042755ed0d5",
                        "ResolutionTxHex": "02000000000101ca94a9ad516ebc0c4bdd7b6254871babfa978d5accafb554214137d398bfcf6a03000000000000000001f2090000000000002200204adb4e2f00643db396dd120d4e7dc17625f5f2c11a40d857accc862d6b7dd80e05004830450221008ec888e36e4a4b3dc2ed6b823319855b2ae03006ca6ae0d9aa7e24bfc1d6f07102203b0f78885472a67ff4fe5916c0bb669487d659527509516fc3a08e87a2cc0a7c0147304402202c3e14282b84b02705dfd00a6da396c9fe8a8bcb1d3fdb4b20a4feba09440e8b02202b058b39aa9b0c865b22095edcd9ff1f71bbfe20aa4993755e54d042755ed0d5012004040404040404040404040404040404040404040404040404040404040404048a76a91414011f7254d96b819c76986c277d115efce6f7b58763ac67210394854aa6eab5b2a8122cc726e9dded053a2184d88256816826d6231c068d4a5b7c8201208763a91418bc1a114ccf9c052d3d23e28d3b0a9d1227434288527c21030d417a46946384f88d5f3337267c5e579765875dc4daca813e21734b140639e752ae677502f801b175ac686800000000"
                    },
                ],
                "RemoteSigHex": "3044022001d55e488b8b035b2dd29d50b65b530923a416d47f377284145bc8767b1b6a75022019bb53ddfe1cefaf156f924777eaaf8fdca1810695a7d0a247ad2afba8232eb4",
                "LocalSigHex": "304402203ca8f31c6a47519f83255dc69f1894d9a6d7476a19f498d31eaf0cd3a85eeb63022026fd92dc752b33905c4c838c528b692a8ad4ced959990b5d5ee2ff940fa90eea",
                "ExpectedCommitmentTxHex": "02000000000101bef67e4e2fb9ddeeb3461973cd4c62abb35050b1add772995b820b584a488489000000000038b02b8006d007000000000000220020403d394747cae42e98ff01734ad5c08f82ba123d3d9a620abda88989651e2ab5d007000000000000220020748eba944fedc8827f6b06bc44678f93c0f9e6078b35c6331ed31e75f8ce0c2db80b000000000000220020c20b5d1f8584fd90443e7b7b720136174fa4b9333c261d04dbbd012635c0f419a00f0000000000002200208c48d15160397c9731df9bc3b236656efb6665fbfe92b4a6878e88a499f741c4c0c62d0000000000160014ccf1af2f2aabee14bb40fa3851ab2301de84311077956a00000000002200204adb4e2f00643db396dd120d4e7dc17625f5f2c11a40d857accc862d6b7dd80e040047304402203ca8f31c6a47519f83255dc69f1894d9a6d7476a19f498d31eaf0cd3a85eeb63022026fd92dc752b33905c4c838c528b692a8ad4ced959990b5d5ee2ff940fa90eea01473044022001d55e488b8b035b2dd29d50b65b530923a416d47f377284145bc8767b1b6a75022019bb53ddfe1cefaf156f924777eaaf8fdca1810695a7d0a247ad2afba8232eb401475221023da092f6980e58d2c037173180e9a465476026ee50f96695963e8efe436f54eb21030e9f7b623d2ccc7c9bd44d66d5ce21ce504c0acf6385a132cec6d3c39fa711c152ae3e195220",
            },
            {
                "Name": "commitment tx with five outputs untrimmed (minimum feerate)",
                "LocalBalance": 6988000000,
                "RemoteBalance": 3000000000,
                "FeePerKw": 2070,
                "UseTestHtlcs": true,
                "HtlcDescs": [
                    {
                        "RemoteSigHex": "3045022100eed143b1ee4bed5dc3cde40afa5db3e7354cbf9c44054b5f713f729356f08cf7022077161d171c2bbd9badf3c9934de65a4918de03bbac1450f715275f75b103f891",
                        "LocalSigHex": "3045022100a0d043ed533e7fb1911e0553d31a8e2f3e6de19dbc035257f29d747c5e02f1f5022030cd38d8e84282175d49c1ebe0470db3ebd59768cf40780a784e248a43904fb8",
                        "ResolutionTxHex": "0200000000010140a83ce364747ff277f4d7595d8d15f708418798922c40bc2b056aca5485a2180000000000000000000174020000000000002200204adb4e2f00643db396dd120d4e7dc17625f5f2c11a40d857accc862d6b7dd80e0500483045022100eed143b1ee4bed5dc3cde40afa5db3e7354cbf9c44054b5f713f729356f08cf7022077161d171c2bbd9badf3c9934de65a4918de03bbac1450f715275f75b103f89101483045022100a0d043ed533e7fb1911e0553d31a8e2f3e6de19dbc035257f29d747c5e02f1f5022030cd38d8e84282175d49c1ebe0470db3ebd59768cf40780a784e248a43904fb801008576a91414011f7254d96b819c76986c277d115efce6f7b58763ac67210394854aa6eab5b2a8122cc726e9dded053a2184d88256816826d6231c068d4a5b7c820120876475527c21030d417a46946384f88d5f3337267c5e579765875dc4daca813e21734b140639e752ae67a914b43e1b38138a41b37f7cd9a1d274bc63e3a9b5d188ac6868f6010000"
                    },
                    {
                        "RemoteSigHex": "3044022071e9357619fd8d29a411dc053b326a5224c5d11268070e88ecb981b174747c7a02202b763ae29a9d0732fa8836dd8597439460b50472183f420021b768981b4f7cf6",
                        "LocalSigHex": "3045022100adb1d679f65f96178b59f23ed37d3b70443118f345224a07ecb043eee2acc157022034d24524fe857144a3bcfff3065a9994d0a6ec5f11c681e49431d573e242612d",
                        "ResolutionTxHex": "0200000000010140a83ce364747ff277f4d7595d8d15f708418798922c40bc2b056aca5485a218010000000000000000015c060000000000002200204adb4e2f00643db396dd120d4e7dc17625f5f2c11a40d857accc862d6b7dd80e0500473044022071e9357619fd8d29a411dc053b326a5224c5d11268070e88ecb981b174747c7a02202b763ae29a9d0732fa8836dd8597439460b50472183f420021b768981b4f7cf601483045022100adb1d679f65f96178b59f23ed37d3b70443118f345224a07ecb043eee2acc157022034d24524fe857144a3bcfff3065a9994d0a6ec5f11c681e49431d573e242612d01008576a91414011f7254d96b819c76986c277d115efce6f7b58763ac67210394854aa6eab5b2a8122cc726e9dded053a2184d88256816826d6231c068d4a5b7c820120876475527c21030d417a46946384f88d5f3337267c5e579765875dc4daca813e21734b140639e752ae67a9148a486ff2e31d6158bf39e2608864d63fefd09d5b88ac6868f7010000"
                    },
                    {
                        "RemoteSigHex": "3045022100c9458a4d2cbb741705577deb0a890e5cb90ee141be0400d3162e533727c9cb2102206edcf765c5dc5e5f9b976ea8149bf8607b5a0efb30691138e1231302b640d2a4",
                        "LocalSigHex": "304402200831422aa4e1ee6d55e0b894201770a8f8817a189356f2d70be76633ffa6a6f602200dd1b84a4855dc6727dd46c98daae43dfc70889d1ba7ef0087529a57c06e5e04",
                        "ResolutionTxHex": "0200000000010140a83ce364747ff277f4d7595d8d15f708418798922c40bc2b056aca5485a21802000000000000000001f1090000000000002200204adb4e2f00643db396dd120d4e7dc17625f5f2c11a40d857accc862d6b7dd80e0500483045022100c9458a4d2cbb741705577deb0a890e5cb90ee141be0400d3162e533727c9cb2102206edcf765c5dc5e5f9b976ea8149bf8607b5a0efb30691138e1231302b640d2a40147304402200831422aa4e1ee6d55e0b894201770a8f8817a189356f2d70be76633ffa6a6f602200dd1b84a4855dc6727dd46c98daae43dfc70889d1ba7ef0087529a57c06e5e04012004040404040404040404040404040404040404040404040404040404040404048a76a91414011f7254d96b819c76986c277d115efce6f7b58763ac67210394854aa6eab5b2a8122cc726e9dded053a2184d88256816826d6231c068d4a5b7c8201208763a91418bc1a114ccf9c052d3d23e28d3b0a9d1227434288527c21030d417a46946384f88d5f3337267c5e579765875dc4daca813e21734b140639e752ae677502f801b175ac686800000000"
                    },
                ],
                "RemoteSigHex": "3045022100f2377f7a67b7fc7f4e2c0c9e3a7de935c32417f5668eda31ea1db401b7dc53030220415fdbc8e91d0f735e70c21952342742e25249b0d062d43efbfc564499f37526",
                "LocalSigHex": "30440220443cb07f650aebbba14b8bc8d81e096712590f524c5991ac0ed3bbc8fd3bd0c7022028a635f548e3ca64b19b69b1ea00f05b22752f91daf0b6dab78e62ba52eb7fd0",
                "ExpectedCommitmentTxHex": "02000000000101bef67e4e2fb9ddeeb3461973cd4c62abb35050b1add772995b820b584a488489000000000038b02b8005d007000000000000220020403d394747cae42e98ff01734ad5c08f82ba123d3d9a620abda88989651e2ab5b80b000000000000220020c20b5d1f8584fd90443e7b7b720136174fa4b9333c261d04dbbd012635c0f419a00f0000000000002200208c48d15160397c9731df9bc3b236656efb6665fbfe92b4a6878e88a499f741c4c0c62d0000000000160014ccf1af2f2aabee14bb40fa3851ab2301de843110da966a00000000002200204adb4e2f00643db396dd120d4e7dc17625f5f2c11a40d857accc862d6b7dd80e04004730440220443cb07f650aebbba14b8bc8d81e096712590f524c5991ac0ed3bbc8fd3bd0c7022028a635f548e3ca64b19b69b1ea00f05b22752f91daf0b6dab78e62ba52eb7fd001483045022100f2377f7a67b7fc7f4e2c0c9e3a7de935c32417f5668eda31ea1db401b7dc53030220415fdbc8e91d0f735e70c21952342742e25249b0d062d43efbfc564499f3752601475221023da092f6980e58d2c037173180e9a465476026ee50f96695963e8efe436f54eb21030e9f7b623d2ccc7c9bd44d66d5ce21ce504c0acf6385a132cec6d3c39fa711c152ae3e195220",
            },
            {
                "Name": "commitment tx with five outputs untrimmed (maximum feerate)",
                "LocalBalance": 6988000000,
                "RemoteBalance": 3000000000,
                "FeePerKw": 2194,
                "UseTestHtlcs": true,
                "HtlcDescs": [
                    {
                        "RemoteSigHex": "30450221009ed2f0a67f99e29c3c8cf45c08207b765980697781bb727fe0b1416de0e7622902206052684229bc171419ed290f4b615c943f819c0262414e43c5b91dcf72ddcf44",
                        "LocalSigHex": "3044022004ad5f04ae69c71b3b141d4db9d0d4c38d84009fb3cfeeae6efdad414487a9a0022042d3fe1388c1ff517d1da7fb4025663d372c14728ed52dc88608363450ff6a2f",
                        "ResolutionTxHex": "02000000000101fb824d4e4dafc0f567789dee3a6bce8d411fe80f5563d8cdfdcc7d7e4447d43a0000000000000000000122020000000000002200204adb4e2f00643db396dd120d4e7dc17625f5f2c11a40d857accc862d6b7dd80e05004830450221009ed2f0a67f99e29c3c8cf45c08207b765980697781bb727fe0b1416de0e7622902206052684229bc171419ed290f4b615c943f819c0262414e43c5b91dcf72ddcf4401473044022004ad5f04ae69c71b3b141d4db9d0d4c38d84009fb3cfeeae6efdad414487a9a0022042d3fe1388c1ff517d1da7fb4025663d372c14728ed52dc88608363450ff6a2f01008576a91414011f7254d96b819c76986c277d115efce6f7b58763ac67210394854aa6eab5b2a8122cc726e9dded053a2184d88256816826d6231c068d4a5b7c820120876475527c21030d417a46946384f88d5f3337267c5e579765875dc4daca813e21734b140639e752ae67a914b43e1b38138a41b37f7cd9a1d274bc63e3a9b5d188ac6868f6010000"
                    },
                    {
                        "RemoteSigHex": "30440220155d3b90c67c33a8321996a9be5b82431b0c126613be751d400669da9d5c696702204318448bcd48824439d2c6a70be6e5747446be47ff45977cf41672bdc9b6b12d",
                        "LocalSigHex": "304402201707050c870c1f77cc3ed58d6d71bf281de239e9eabd8ef0955bad0d7fe38dcc02204d36d80d0019b3a71e646a08fa4a5607761d341ae8be371946ebe437c289c915",
                        "ResolutionTxHex": "02000000000101fb824d4e4dafc0f567789dee3a6bce8d411fe80f5563d8cdfdcc7d7e4447d43a010000000000000000010a060000000000002200204adb4e2f00643db396dd120d4e7dc17625f5f2c11a40d857accc862d6b7dd80e05004730440220155d3b90c67c33a8321996a9be5b82431b0c126613be751d400669da9d5c696702204318448bcd48824439d2c6a70be6e5747446be47ff45977cf41672bdc9b6b12d0147304402201707050c870c1f77cc3ed58d6d71bf281de239e9eabd8ef0955bad0d7fe38dcc02204d36d80d0019b3a71e646a08fa4a5607761d341ae8be371946ebe437c289c91501008576a91414011f7254d96b819c76986c277d115efce6f7b58763ac67210394854aa6eab5b2a8122cc726e9dded053a2184d88256816826d6231c068d4a5b7c820120876475527c21030d417a46946384f88d5f3337267c5e579765875dc4daca813e21734b140639e752ae67a9148a486ff2e31d6158bf39e2608864d63fefd09d5b88ac6868f7010000"
                    },
                    {
                        "RemoteSigHex": "3045022100a12a9a473ece548584aabdd051779025a5ed4077c4b7aa376ec7a0b1645e5a48022039490b333f53b5b3e2ddde1d809e492cba2b3e5fc3a436cd3ffb4cd3d500fa5a",
                        "LocalSigHex": "3045022100ff200bc934ab26ce9a559e998ceb0aee53bc40368e114ab9d3054d9960546e2802202496856ca163ac12c143110b6b3ac9d598df7254f2e17b3b94c3ab5301f4c3b0",
                        "ResolutionTxHex": "02000000000101fb824d4e4dafc0f567789dee3a6bce8d411fe80f5563d8cdfdcc7d7e4447d43a020000000000000000019a090000000000002200204adb4e2f00643db396dd120d4e7dc17625f5f2c11a40d857accc862d6b7dd80e0500483045022100a12a9a473ece548584aabdd051779025a5ed4077c4b7aa376ec7a0b1645e5a48022039490b333f53b5b3e2ddde1d809e492cba2b3e5fc3a436cd3ffb4cd3d500fa5a01483045022100ff200bc934ab26ce9a559e998ceb0aee53bc40368e114ab9d3054d9960546e2802202496856ca163ac12c143110b6b3ac9d598df7254f2e17b3b94c3ab5301f4c3b0012004040404040404040404040404040404040404040404040404040404040404048a76a91414011f7254d96b819c76986c277d115efce6f7b58763ac67210394854aa6eab5b2a8122cc726e9dded053a2184d88256816826d6231c068d4a5b7c8201208763a91418bc1a114ccf9c052d3d23e28d3b0a9d1227434288527c21030d417a46946384f88d5f3337267c5e579765875dc4daca813e21734b140639e752ae677502f801b175ac686800000000"
                    },
                ],
                "RemoteSigHex": "3045022100d33c4e541aa1d255d41ea9a3b443b3b822ad8f7f86862638aac1f69f8f760577022007e2a18e6931ce3d3a804b1c78eda1de17dbe1fb7a95488c9a4ec86203953348",
                "LocalSigHex": "304402203b1b010c109c2ecbe7feb2d259b9c4126bd5dc99ee693c422ec0a5781fe161ba0220571fe4e2c649dea9c7aaf7e49b382962f6a3494963c97d80fef9a430ca3f7061",
                "ExpectedCommitmentTxHex": "02000000000101bef67e4e2fb9ddeeb3461973cd4c62abb35050b1add772995b820b584a488489000000000038b02b8005d007000000000000220020403d394747cae42e98ff01734ad5c08f82ba123d3d9a620abda88989651e2ab5b80b000000000000220020c20b5d1f8584fd90443e7b7b720136174fa4b9333c261d04dbbd012635c0f419a00f0000000000002200208c48d15160397c9731df9bc3b236656efb6665fbfe92b4a6878e88a499f741c4c0c62d0000000000160014ccf1af2f2aabee14bb40fa3851ab2301de84311040966a00000000002200204adb4e2f00643db396dd120d4e7dc17625f5f2c11a40d857accc862d6b7dd80e040047304402203b1b010c109c2ecbe7feb2d259b9c4126bd5dc99ee693c422ec0a5781fe161ba0220571fe4e2c649dea9c7aaf7e49b382962f6a3494963c97d80fef9a430ca3f706101483045022100d33c4e541aa1d255d41ea9a3b443b3b822ad8f7f86862638aac1f69f8f760577022007e2a18e6931ce3d3a804b1c78eda1de17dbe1fb7a95488c9a4ec8620395334801475221023da092f6980e58d2c037173180e9a465476026ee50f96695963e8efe436f54eb21030e9f7b623d2ccc7c9bd44d66d5ce21ce504c0acf6385a132cec6d3c39fa711c152ae3e195220",
            },

            {
                "Name": "commitment tx with four outputs untrimmed (minimum feerate)",
                "LocalBalance": 6988000000,
                "RemoteBalance": 3000000000,
                "FeePerKw": 2195,
                "UseTestHtlcs": true,
                "HtlcDescs": [
                    {
                        "RemoteSigHex": "3045022100a8a78fa1016a5c5c3704f2e8908715a3cef66723fb95f3132ec4d2d05cd84fb4022025ac49287b0861ec21932405f5600cbce94313dbde0e6c5d5af1b3366d8afbfc",
                        "LocalSigHex": "3045022100be6ae1977fd7b630a53623f3f25c542317ccfc2b971782802a4f1ef538eb22b402207edc4d0408f8f38fd3c7365d1cfc26511b7cd2d4fecd8b005fba3cd5bc704390",
                        "ResolutionTxHex": "020000000001014e16c488fa158431c1a82e8f661240ec0a71ba0ce92f2721a6538c510226ad5c0000000000000000000109060000000000002200204adb4e2f00643db396dd120d4e7dc17625f5f2c11a40d857accc862d6b7dd80e0500483045022100a8a78fa1016a5c5c3704f2e8908715a3cef66723fb95f3132ec4d2d05cd84fb4022025ac49287b0861ec21932405f5600cbce94313dbde0e6c5d5af1b3366d8afbfc01483045022100be6ae1977fd7b630a53623f3f25c542317ccfc2b971782802a4f1ef538eb22b402207edc4d0408f8f38fd3c7365d1cfc26511b7cd2d4fecd8b005fba3cd5bc70439001008576a91414011f7254d96b819c76986c277d115efce6f7b58763ac67210394854aa6eab5b2a8122cc726e9dded053a2184d88256816826d6231c068d4a5b7c820120876475527c21030d417a46946384f88d5f3337267c5e579765875dc4daca813e21734b140639e752ae67a9148a486ff2e31d6158bf39e2608864d63fefd09d5b88ac6868f7010000"
                    },
                    {
                        "RemoteSigHex": "3045022100e769cb156aa2f7515d126cef7a69968629620ce82afcaa9e210969de6850df4602200b16b3f3486a229a48aadde520dbee31ae340dbadaffae74fbb56681fef27b92",
                        "LocalSigHex": "30440220665b9cb4a978c09d1ca8977a534999bc8a49da624d0c5439451dd69cde1a003d022070eae0620f01f3c1bd029cc1488da13fb40fdab76f396ccd335479a11c5276d8",
                        "ResolutionTxHex": "020000000001014e16c488fa158431c1a82e8f661240ec0a71ba0ce92f2721a6538c510226ad5c0100000000000000000199090000000000002200204adb4e2f00643db396dd120d4e7dc17625f5f2c11a40d857accc862d6b7dd80e0500483045022100e769cb156aa2f7515d126cef7a69968629620ce82afcaa9e210969de6850df4602200b16b3f3486a229a48aadde520dbee31ae340dbadaffae74fbb56681fef27b92014730440220665b9cb4a978c09d1ca8977a534999bc8a49da624d0c5439451dd69cde1a003d022070eae0620f01f3c1bd029cc1488da13fb40fdab76f396ccd335479a11c5276d8012004040404040404040404040404040404040404040404040404040404040404048a76a91414011f7254d96b819c76986c277d115efce6f7b58763ac67210394854aa6eab5b2a8122cc726e9dded053a2184d88256816826d6231c068d4a5b7c8201208763a91418bc1a114ccf9c052d3d23e28d3b0a9d1227434288527c21030d417a46946384f88d5f3337267c5e579765875dc4daca813e21734b140639e752ae677502f801b175ac686800000000"
                    },
                ],
                "RemoteSigHex": "304402205e2f76d4657fb732c0dfc820a18a7301e368f5799e06b7828007633741bda6df0220458009ae59d0c6246065c419359e05eb2a4b4ef4a1b310cc912db44eb7924298",
                "LocalSigHex": "304402203b12d44254244b8ff3bb4129b0920fd45120ab42f553d9976394b099d500c99e02205e95bb7a3164852ef0c48f9e0eaf145218f8e2c41251b231f03cbdc4f29a5429",
                "ExpectedCommitmentTxHex": "02000000000101bef67e4e2fb9ddeeb3461973cd4c62abb35050b1add772995b820b584a488489000000000038b02b8004b80b000000000000220020c20b5d1f8584fd90443e7b7b720136174fa4b9333c261d04dbbd012635c0f419a00f0000000000002200208c48d15160397c9731df9bc3b236656efb6665fbfe92b4a6878e88a499f741c4c0c62d0000000000160014ccf1af2f2aabee14bb40fa3851ab2301de843110b8976a00000000002200204adb4e2f00643db396dd120d4e7dc17625f5f2c11a40d857accc862d6b7dd80e040047304402203b12d44254244b8ff3bb4129b0920fd45120ab42f553d9976394b099d500c99e02205e95bb7a3164852ef0c48f9e0eaf145218f8e2c41251b231f03cbdc4f29a54290147304402205e2f76d4657fb732c0dfc820a18a7301e368f5799e06b7828007633741bda6df0220458009ae59d0c6246065c419359e05eb2a4b4ef4a1b310cc912db44eb792429801475221023da092f6980e58d2c037173180e9a465476026ee50f96695963e8efe436f54eb21030e9f7b623d2ccc7c9bd44d66d5ce21ce504c0acf6385a132cec6d3c39fa711c152ae3e195220",
            },
            {
                "Name": "commitment tx with four outputs untrimmed (maximum feerate)",
                "LocalBalance": 6988000000,
                "RemoteBalance": 3000000000,
                "FeePerKw": 3702,
                "UseTestHtlcs": true,
                "HtlcDescs": [
                    {
                        "RemoteSigHex": "3045022100dfb73b4fe961b31a859b2bb1f4f15cabab9265016dd0272323dc6a9e85885c54022059a7b87c02861ee70662907f25ce11597d7b68d3399443a831ae40e777b76bdb",
                        "LocalSigHex": "304402202765b9c9ece4f127fa5407faf66da4c5ce2719cdbe47cd3175fc7d48b482e43d02205605125925e07bad1e41c618a4b434d72c88a164981c4b8af5eaf4ee9142ec3a",
                        "ResolutionTxHex": "02000000000101b8de11eb51c22498fe39722c7227b6e55ff1a94146cf638458cb9bc6a060d3a30000000000000000000122020000000000002200204adb4e2f00643db396dd120d4e7dc17625f5f2c11a40d857accc862d6b7dd80e0500483045022100dfb73b4fe961b31a859b2bb1f4f15cabab9265016dd0272323dc6a9e85885c54022059a7b87c02861ee70662907f25ce11597d7b68d3399443a831ae40e777b76bdb0147304402202765b9c9ece4f127fa5407faf66da4c5ce2719cdbe47cd3175fc7d48b482e43d02205605125925e07bad1e41c618a4b434d72c88a164981c4b8af5eaf4ee9142ec3a01008576a91414011f7254d96b819c76986c277d115efce6f7b58763ac67210394854aa6eab5b2a8122cc726e9dded053a2184d88256816826d6231c068d4a5b7c820120876475527c21030d417a46946384f88d5f3337267c5e579765875dc4daca813e21734b140639e752ae67a9148a486ff2e31d6158bf39e2608864d63fefd09d5b88ac6868f7010000"
                    },
                    {
                        "RemoteSigHex": "3045022100ea9dc2a7c3c3640334dab733bb4e036e32a3106dc707b24227874fa4f7da746802204d672f7ac0fe765931a8df10b81e53a3242dd32bd9dc9331eb4a596da87954e9",
                        "LocalSigHex": "30440220048a41c660c4841693de037d00a407810389f4574b3286afb7bc392a438fa3f802200401d71fa87c64fe621b49ac07e3bf85157ac680acb977124da28652cc7f1a5c",
                        "ResolutionTxHex": "02000000000101b8de11eb51c22498fe39722c7227b6e55ff1a94146cf638458cb9bc6a060d3a30100000000000000000176050000000000002200204adb4e2f00643db396dd120d4e7dc17625f5f2c11a40d857accc862d6b7dd80e0500483045022100ea9dc2a7c3c3640334dab733bb4e036e32a3106dc707b24227874fa4f7da746802204d672f7ac0fe765931a8df10b81e53a3242dd32bd9dc9331eb4a596da87954e9014730440220048a41c660c4841693de037d00a407810389f4574b3286afb7bc392a438fa3f802200401d71fa87c64fe621b49ac07e3bf85157ac680acb977124da28652cc7f1a5c012004040404040404040404040404040404040404040404040404040404040404048a76a91414011f7254d96b819c76986c277d115efce6f7b58763ac67210394854aa6eab5b2a8122cc726e9dded053a2184d88256816826d6231c068d4a5b7c8201208763a91418bc1a114ccf9c052d3d23e28d3b0a9d1227434288527c21030d417a46946384f88d5f3337267c5e579765875dc4daca813e21734b140639e752ae677502f801b175ac686800000000"
                    },
                ],
                "RemoteSigHex": "3045022100c1a3b0b60ca092ed5080121f26a74a20cec6bdee3f8e47bae973fcdceb3eda5502207d467a9873c939bf3aa758014ae67295fedbca52412633f7e5b2670fc7c381c1",
                "LocalSigHex": "304402200e930a43c7951162dc15a2b7344f48091c74c70f7024e7116e900d8bcfba861c022066fa6cbda3929e21daa2e7e16a4b948db7e8919ef978402360d1095ffdaff7b0",
                "ExpectedCommitmentTxHex": "02000000000101bef67e4e2fb9ddeeb3461973cd4c62abb35050b1add772995b820b584a488489000000000038b02b8004b80b000000000000220020c20b5d1f8584fd90443e7b7b720136174fa4b9333c261d04dbbd012635c0f419a00f0000000000002200208c48d15160397c9731df9bc3b236656efb6665fbfe92b4a6878e88a499f741c4c0c62d0000000000160014ccf1af2f2aabee14bb40fa3851ab2301de8431106f916a00000000002200204adb4e2f00643db396dd120d4e7dc17625f5f2c11a40d857accc862d6b7dd80e040047304402200e930a43c7951162dc15a2b7344f48091c74c70f7024e7116e900d8bcfba861c022066fa6cbda3929e21daa2e7e16a4b948db7e8919ef978402360d1095ffdaff7b001483045022100c1a3b0b60ca092ed5080121f26a74a20cec6bdee3f8e47bae973fcdceb3eda5502207d467a9873c939bf3aa758014ae67295fedbca52412633f7e5b2670fc7c381c101475221023da092f6980e58d2c037173180e9a465476026ee50f96695963e8efe436f54eb21030e9f7b623d2ccc7c9bd44d66d5ce21ce504c0acf6385a132cec6d3c39fa711c152ae3e195220",
            },

            {
                "Name": "commitment tx with three outputs untrimmed (minimum feerate)",
                "LocalBalance": 6988000000,
                "RemoteBalance": 3000000000,
                "FeePerKw": 3703,
                "UseTestHtlcs": true,
                "HtlcDescs": [
                    {
                        "RemoteSigHex": "3044022044f65cf833afdcb9d18795ca93f7230005777662539815b8a601eeb3e57129a902206a4bf3e53392affbba52640627defa8dc8af61c958c9e827b2798ab45828abdd",
                        "LocalSigHex": "3045022100b94d931a811b32eeb885c28ddcf999ae1981893b21dd1329929543fe87ce793002206370107fdd151c5f2384f9ceb71b3107c69c74c8ed5a28a94a4ab2d27d3b0724",
                        "ResolutionTxHex": "020000000001011c076aa7fb3d7460d10df69432c904227ea84bbf3134d4ceee5fb0f135ef206d0000000000000000000175050000000000002200204adb4e2f00643db396dd120d4e7dc17625f5f2c11a40d857accc862d6b7dd80e0500473044022044f65cf833afdcb9d18795ca93f7230005777662539815b8a601eeb3e57129a902206a4bf3e53392affbba52640627defa8dc8af61c958c9e827b2798ab45828abdd01483045022100b94d931a811b32eeb885c28ddcf999ae1981893b21dd1329929543fe87ce793002206370107fdd151c5f2384f9ceb71b3107c69c74c8ed5a28a94a4ab2d27d3b0724012004040404040404040404040404040404040404040404040404040404040404048a76a91414011f7254d96b819c76986c277d115efce6f7b58763ac67210394854aa6eab5b2a8122cc726e9dded053a2184d88256816826d6231c068d4a5b7c8201208763a91418bc1a114ccf9c052d3d23e28d3b0a9d1227434288527c21030d417a46946384f88d5f3337267c5e579765875dc4daca813e21734b140639e752ae677502f801b175ac686800000000"
                    },
                ],
                "RemoteSigHex": "30450221008b7c191dd46893b67b628e618d2dc8e81169d38bade310181ab77d7c94c6675e02203b4dd131fd7c9deb299560983dcdc485545c98f989f7ae8180c28289f9e6bdb0",
                "LocalSigHex": "3044022047305531dd44391dce03ae20f8735005c615eb077a974edb0059ea1a311857d602202e0ed6972fbdd1e8cb542b06e0929bc41b2ddf236e04cb75edd56151f4197506",
                "ExpectedCommitmentTxHex": "02000000000101bef67e4e2fb9ddeeb3461973cd4c62abb35050b1add772995b820b584a488489000000000038b02b8003a00f0000000000002200208c48d15160397c9731df9bc3b236656efb6665fbfe92b4a6878e88a499f741c4c0c62d0000000000160014ccf1af2f2aabee14bb40fa3851ab2301de843110eb936a00000000002200204adb4e2f00643db396dd120d4e7dc17625f5f2c11a40d857accc862d6b7dd80e0400473044022047305531dd44391dce03ae20f8735005c615eb077a974edb0059ea1a311857d602202e0ed6972fbdd1e8cb542b06e0929bc41b2ddf236e04cb75edd56151f4197506014830450221008b7c191dd46893b67b628e618d2dc8e81169d38bade310181ab77d7c94c6675e02203b4dd131fd7c9deb299560983dcdc485545c98f989f7ae8180c28289f9e6bdb001475221023da092f6980e58d2c037173180e9a465476026ee50f96695963e8efe436f54eb21030e9f7b623d2ccc7c9bd44d66d5ce21ce504c0acf6385a132cec6d3c39fa711c152ae3e195220",
            },
            {
                "Name": "commitment tx with three outputs untrimmed (maximum feerate)",
                "LocalBalance": 6988000000,
                "RemoteBalance": 3000000000,
                "FeePerKw": 4914,
                "UseTestHtlcs": true,
                "HtlcDescs": [
                    {
                        "RemoteSigHex": "3045022100fcb38506bfa11c02874092a843d0cc0a8613c23b639832564a5f69020cb0f6ba02206508b9e91eaa001425c190c68ee5f887e1ad5b1b314002e74db9dbd9e42dbecf",
                        "LocalSigHex": "304502210086e76b460ddd3cea10525fba298405d3fe11383e56966a5091811368362f689a02200f72ee75657915e0ede89c28709acd113ede9e1b7be520e3bc5cda425ecd6e68",
                        "ResolutionTxHex": "0200000000010110a3fdcbcd5db477cd3ad465e7f501ffa8c437e8301f00a6061138590add757f0000000000000000000122020000000000002200204adb4e2f00643db396dd120d4e7dc17625f5f2c11a40d857accc862d6b7dd80e0500483045022100fcb38506bfa11c02874092a843d0cc0a8613c23b639832564a5f69020cb0f6ba02206508b9e91eaa001425c190c68ee5f887e1ad5b1b314002e74db9dbd9e42dbecf0148304502210086e76b460ddd3cea10525fba298405d3fe11383e56966a5091811368362f689a02200f72ee75657915e0ede89c28709acd113ede9e1b7be520e3bc5cda425ecd6e68012004040404040404040404040404040404040404040404040404040404040404048a76a91414011f7254d96b819c76986c277d115efce6f7b58763ac67210394854aa6eab5b2a8122cc726e9dded053a2184d88256816826d6231c068d4a5b7c8201208763a91418bc1a114ccf9c052d3d23e28d3b0a9d1227434288527c21030d417a46946384f88d5f3337267c5e579765875dc4daca813e21734b140639e752ae677502f801b175ac686800000000"
                    },
                ],
                "RemoteSigHex": "304402206d6cb93969d39177a09d5d45b583f34966195b77c7e585cf47ac5cce0c90cefb022031d71ae4e33a4e80df7f981d696fbdee517337806a3c7138b7491e2cbb077a0e",
                "LocalSigHex": "304402206a2679efa3c7aaffd2a447fd0df7aba8792858b589750f6a1203f9259173198a022008d52a0e77a99ab533c36206cb15ad7aeb2aa72b93d4b571e728cb5ec2f6fe26",
                "ExpectedCommitmentTxHex": "02000000000101bef67e4e2fb9ddeeb3461973cd4c62abb35050b1add772995b820b584a488489000000000038b02b8003a00f0000000000002200208c48d15160397c9731df9bc3b236656efb6665fbfe92b4a6878e88a499f741c4c0c62d0000000000160014ccf1af2f2aabee14bb40fa3851ab2301de843110ae8f6a00000000002200204adb4e2f00643db396dd120d4e7dc17625f5f2c11a40d857accc862d6b7dd80e040047304402206a2679efa3c7aaffd2a447fd0df7aba8792858b589750f6a1203f9259173198a022008d52a0e77a99ab533c36206cb15ad7aeb2aa72b93d4b571e728cb5ec2f6fe260147304402206d6cb93969d39177a09d5d45b583f34966195b77c7e585cf47ac5cce0c90cefb022031d71ae4e33a4e80df7f981d696fbdee517337806a3c7138b7491e2cbb077a0e01475221023da092f6980e58d2c037173180e9a465476026ee50f96695963e8efe436f54eb21030e9f7b623d2ccc7c9bd44d66d5ce21ce504c0acf6385a132cec6d3c39fa711c152ae3e195220",
            },

            {
                "Name": "commitment tx with two outputs untrimmed (minimum feerate)",
                "LocalBalance": 6988000000,
                "RemoteBalance": 3000000000,
                "FeePerKw": 4915,
                "UseTestHtlcs": true,
                "HtlcDescs": [
                ],
                "RemoteSigHex": "304402200769ba89c7330dfa4feba447b6e322305f12ac7dac70ec6ba997ed7c1b598d0802204fe8d337e7fee781f9b7b1a06e580b22f4f79d740059560191d7db53f8765552",
                "LocalSigHex": "3045022100a012691ba6cea2f73fa8bac37750477e66363c6d28813b0bb6da77c8eb3fb0270220365e99c51304b0b1a6ab9ea1c8500db186693e39ec1ad5743ee231b0138384b9",
                "ExpectedCommitmentTxHex": "02000000000101bef67e4e2fb9ddeeb3461973cd4c62abb35050b1add772995b820b584a488489000000000038b02b8002c0c62d0000000000160014ccf1af2f2aabee14bb40fa3851ab2301de843110fa926a00000000002200204adb4e2f00643db396dd120d4e7dc17625f5f2c11a40d857accc862d6b7dd80e0400483045022100a012691ba6cea2f73fa8bac37750477e66363c6d28813b0bb6da77c8eb3fb0270220365e99c51304b0b1a6ab9ea1c8500db186693e39ec1ad5743ee231b0138384b90147304402200769ba89c7330dfa4feba447b6e322305f12ac7dac70ec6ba997ed7c1b598d0802204fe8d337e7fee781f9b7b1a06e580b22f4f79d740059560191d7db53f876555201475221023da092f6980e58d2c037173180e9a465476026ee50f96695963e8efe436f54eb21030e9f7b623d2ccc7c9bd44d66d5ce21ce504c0acf6385a132cec6d3c39fa711c152ae3e195220",
            },
            {
                "Name": "commitment tx with two outputs untrimmed (maximum feerate)",
                "LocalBalance": 6988000000,
                "RemoteBalance": 3000000000,
                "FeePerKw": 9651180,
                "UseTestHtlcs": true,
                "HtlcDescs": [
                ],
                "RemoteSigHex": "3044022037f83ff00c8e5fb18ae1f918ffc24e54581775a20ff1ae719297ef066c71caa9022039c529cccd89ff6c5ed1db799614533844bd6d101da503761c45c713996e3bbd",
                "LocalSigHex": "30440220514f977bf7edc442de8ce43ace9686e5ebdc0f893033f13e40fb46c8b8c6e1f90220188006227d175f5c35da0b092c57bea82537aed89f7778204dc5bacf4f29f2b9",
                "ExpectedCommitmentTxHex": "02000000000101bef67e4e2fb9ddeeb3461973cd4c62abb35050b1add772995b820b584a488489000000000038b02b800222020000000000002200204adb4e2f00643db396dd120d4e7dc17625f5f2c11a40d857accc862d6b7dd80ec0c62d0000000000160014ccf1af2f2aabee14bb40fa3851ab2301de84311004004730440220514f977bf7edc442de8ce43ace9686e5ebdc0f893033f13e40fb46c8b8c6e1f90220188006227d175f5c35da0b092c57bea82537aed89f7778204dc5bacf4f29f2b901473044022037f83ff00c8e5fb18ae1f918ffc24e54581775a20ff1ae719297ef066c71caa9022039c529cccd89ff6c5ed1db799614533844bd6d101da503761c45c713996e3bbd01475221023da092f6980e58d2c037173180e9a465476026ee50f96695963e8efe436f54eb21030e9f7b623d2ccc7c9bd44d66d5ce21ce504c0acf6385a132cec6d3c39fa711c152ae3e195220",
            },

            {
                "Name": "commitment tx with one output untrimmed (minimum feerate)",
                "LocalBalance": 6988000000,
                "RemoteBalance": 3000000000,
                "FeePerKw": 9651181,
                "UseTestHtlcs": true,
                "HtlcDescs": [
                ],
                "RemoteSigHex": "3044022064901950be922e62cbe3f2ab93de2b99f37cff9fc473e73e394b27f88ef0731d02206d1dfa227527b4df44a07599289e207d6fd9cca60c0365682dcd3deaf739567e",
                "LocalSigHex": "3044022031a82b51bd014915fe68928d1abf4b9885353fb896cac10c3fdd88d7f9c7f2e00220716bda819641d2c63e65d3549b6120112e1aeaf1742eed94a471488e79e206b1",
                "ExpectedCommitmentTxHex": "02000000000101bef67e4e2fb9ddeeb3461973cd4c62abb35050b1add772995b820b584a488489000000000038b02b8001c0c62d0000000000160014ccf1af2f2aabee14bb40fa3851ab2301de8431100400473044022031a82b51bd014915fe68928d1abf4b9885353fb896cac10c3fdd88d7f9c7f2e00220716bda819641d2c63e65d3549b6120112e1aeaf1742eed94a471488e79e206b101473044022064901950be922e62cbe3f2ab93de2b99f37cff9fc473e73e394b27f88ef0731d02206d1dfa227527b4df44a07599289e207d6fd9cca60c0365682dcd3deaf739567e01475221023da092f6980e58d2c037173180e9a465476026ee50f96695963e8efe436f54eb21030e9f7b623d2ccc7c9bd44d66d5ce21ce504c0acf6385a132cec6d3c39fa711c152ae3e195220",
            },
            {
                "Name": "commitment tx with fee greater than funder amount",
                "LocalBalance": 6988000000,
                "RemoteBalance": 3000000000,
                "FeePerKw": 9651936,
                "UseTestHtlcs": true,
                "HtlcDescs": [
                ],
                "RemoteSigHex": "3044022064901950be922e62cbe3f2ab93de2b99f37cff9fc473e73e394b27f88ef0731d02206d1dfa227527b4df44a07599289e207d6fd9cca60c0365682dcd3deaf739567e",
                "LocalSigHex": "3044022031a82b51bd014915fe68928d1abf4b9885353fb896cac10c3fdd88d7f9c7f2e00220716bda819641d2c63e65d3549b6120112e1aeaf1742eed94a471488e79e206b1",
                "ExpectedCommitmentTxHex": "02000000000101bef67e4e2fb9ddeeb3461973cd4c62abb35050b1add772995b820b584a488489000000000038b02b8001c0c62d0000000000160014ccf1af2f2aabee14bb40fa3851ab2301de8431100400473044022031a82b51bd014915fe68928d1abf4b9885353fb896cac10c3fdd88d7f9c7f2e00220716bda819641d2c63e65d3549b6120112e1aeaf1742eed94a471488e79e206b101473044022064901950be922e62cbe3f2ab93de2b99f37cff9fc473e73e394b27f88ef0731d02206d1dfa227527b4df44a07599289e207d6fd9cca60c0365682dcd3deaf739567e01475221023da092f6980e58d2c037173180e9a465476026ee50f96695963e8efe436f54eb21030e9f7b623d2ccc7c9bd44d66d5ce21ce504c0acf6385a132cec6d3c39fa711c152ae3e195220",
            },
            {
                "Name": "commitment tx with 3 htlc outputs, 2 offered having the same amount and preimage",
                "LocalBalance": 6988000000,
                "RemoteBalance": 3000000000,
                "FeePerKw": 253,
                "UseTestHtlcs": true,
                "TestHtlcs": [
                    channel.htlcs[1],
                    new Htlc(
                        5n,
                        HtlcDirection.Offered,
                        Value.fromMilliSats(5000000),
                        505,
                        sha256(b("0505050505050505050505050505050505050505050505050505050505050505")),
                        b("0505050505050505050505050505050505050505050505050505050505050505"),
                    ),
                    new Htlc(
                        6n,
                        HtlcDirection.Offered,
                        Value.fromMilliSats(5000000),
                        506,
                        sha256(b("0505050505050505050505050505050505050505050505050505050505050505")),
                        b("0505050505050505050505050505050505050505050505050505050505050505"),
                    ),
                ],
                "HtlcDescs": [
                    {
                        "RemoteSigHex": "3044022031694c29682ed2646dc6b64f59236f7d262027cac742b89030692483ca8326fe022040ca3216802d232eb04894f81008785b82b74812983fc05f93db7db5ff5ef613",
                        "LocalSigHex": "304402203198b389ca301ee713eef7beb2b73655fa28eb25ac3cb2e6b295767776fe67a402206e7dcfbcd5ce2bcadf254ba9911c9a770d3e1b752b276575ba8b9fd1c2b424e7",
                        "ResolutionTxHex": "0200000000010175a53c9a465f56140f1c7b2c42b27f0e56b508e39cb6971f3c5b551cfda8e5e4000000000000000000011f070000000000002200204adb4e2f00643db396dd120d4e7dc17625f5f2c11a40d857accc862d6b7dd80e0500473044022031694c29682ed2646dc6b64f59236f7d262027cac742b89030692483ca8326fe022040ca3216802d232eb04894f81008785b82b74812983fc05f93db7db5ff5ef6130147304402203198b389ca301ee713eef7beb2b73655fa28eb25ac3cb2e6b295767776fe67a402206e7dcfbcd5ce2bcadf254ba9911c9a770d3e1b752b276575ba8b9fd1c2b424e7012001010101010101010101010101010101010101010101010101010101010101018a76a91414011f7254d96b819c76986c277d115efce6f7b58763ac67210394854aa6eab5b2a8122cc726e9dded053a2184d88256816826d6231c068d4a5b7c8201208763a9144b6b2e5444c2639cc0fb7bcea5afba3f3cdce23988527c21030d417a46946384f88d5f3337267c5e579765875dc4daca813e21734b140639e752ae677502f501b175ac686800000000"
                    },
                    {
                        "RemoteSigHex": "3045022100b3884c0174eb3650e68807bba145a752f8769b4ec886e95553f78380edbd28e6022058621ac2f742239f7be25b549d2f3bad9a1524f2b346a247fcb151afb1c4c5eb",
                        "LocalSigHex": "304402201ef4ba8337e517980256d61301ab83e528d4aab79c9610066ef200a6b252d58d0220277cebbbff3ac7d1fecafd8befe1525470b3ee180d282fc8c36e0237c96d9739",
                        "ResolutionTxHex": "0200000000010175a53c9a465f56140f1c7b2c42b27f0e56b508e39cb6971f3c5b551cfda8e5e401000000000000000001e1120000000000002200204adb4e2f00643db396dd120d4e7dc17625f5f2c11a40d857accc862d6b7dd80e0500483045022100b3884c0174eb3650e68807bba145a752f8769b4ec886e95553f78380edbd28e6022058621ac2f742239f7be25b549d2f3bad9a1524f2b346a247fcb151afb1c4c5eb0147304402201ef4ba8337e517980256d61301ab83e528d4aab79c9610066ef200a6b252d58d0220277cebbbff3ac7d1fecafd8befe1525470b3ee180d282fc8c36e0237c96d973901008576a91414011f7254d96b819c76986c277d115efce6f7b58763ac67210394854aa6eab5b2a8122cc726e9dded053a2184d88256816826d6231c068d4a5b7c820120876475527c21030d417a46946384f88d5f3337267c5e579765875dc4daca813e21734b140639e752ae67a9142002cc93ebefbb1b73f0af055dcc27a0b504ad7688ac6868f9010000"
                    },
                    {
                        "RemoteSigHex": "3045022100de2757977d17699d092c1b05cebb52fa498de5d5fba6a60762f73aa7354ad8a50220199295de83336966e7387e8ebb2f105adc0db516260d6cd1e3c166f8b32d853e",
                        "LocalSigHex": "30440220207ee7d74a0f223b5d05db49653c541d4a043f2ab3e88abbeeb5f1d1d761535902207de25db7f70a939eae6cec89d8487ad1e9c953cb0f30a5f84e5ade5736d6f9ce",
                        "ResolutionTxHex": "0200000000010175a53c9a465f56140f1c7b2c42b27f0e56b508e39cb6971f3c5b551cfda8e5e402000000000000000001e1120000000000002200204adb4e2f00643db396dd120d4e7dc17625f5f2c11a40d857accc862d6b7dd80e0500483045022100de2757977d17699d092c1b05cebb52fa498de5d5fba6a60762f73aa7354ad8a50220199295de83336966e7387e8ebb2f105adc0db516260d6cd1e3c166f8b32d853e014730440220207ee7d74a0f223b5d05db49653c541d4a043f2ab3e88abbeeb5f1d1d761535902207de25db7f70a939eae6cec89d8487ad1e9c953cb0f30a5f84e5ade5736d6f9ce01008576a91414011f7254d96b819c76986c277d115efce6f7b58763ac67210394854aa6eab5b2a8122cc726e9dded053a2184d88256816826d6231c068d4a5b7c820120876475527c21030d417a46946384f88d5f3337267c5e579765875dc4daca813e21734b140639e752ae67a9142002cc93ebefbb1b73f0af055dcc27a0b504ad7688ac6868fa010000"
                    },
                ],
                "RemoteSigHex": "3044022044f807aefa41480a5d1df2fc312c486900617fd24493cf41976428cb249ec2c2022007fd1229cfb57d638b9c137b03bc7917d0e418b63e62a3642f1c13354cc71df8",
                "LocalSigHex": "304502210098674686a13c7da2d95abea08d27e9324573156d79e5eb08cd96d1e33bb0045002206391216f4fd5fb7b0fe8c43074fd19f485dd47d7b07f7325c5a6121f5b0a591b",
                "ExpectedCommitmentTxHex": "02000000000101bef67e4e2fb9ddeeb3461973cd4c62abb35050b1add772995b820b584a488489000000000038b02b8005d007000000000000220020748eba944fedc8827f6b06bc44678f93c0f9e6078b35c6331ed31e75f8ce0c2d8813000000000000220020305c12e1a0bc21e283c131cea1c66d68857d28b7b2fce0a6fbc40c164852121b8813000000000000220020305c12e1a0bc21e283c131cea1c66d68857d28b7b2fce0a6fbc40c164852121bc0c62d0000000000160014ccf1af2f2aabee14bb40fa3851ab2301de843110a79f6a00000000002200204adb4e2f00643db396dd120d4e7dc17625f5f2c11a40d857accc862d6b7dd80e040048304502210098674686a13c7da2d95abea08d27e9324573156d79e5eb08cd96d1e33bb0045002206391216f4fd5fb7b0fe8c43074fd19f485dd47d7b07f7325c5a6121f5b0a591b01473044022044f807aefa41480a5d1df2fc312c486900617fd24493cf41976428cb249ec2c2022007fd1229cfb57d638b9c137b03bc7917d0e418b63e62a3642f1c13354cc71df801475221023da092f6980e58d2c037173180e9a465476026ee50f96695963e8efe436f54eb21030e9f7b623d2ccc7c9bd44d66d5ce21ce504c0acf6385a132cec6d3c39fa711c152ae3e195220",
            },
            {
                "Name": "option_static_remotekey - simple commitment tx with no HTLCs",
                "OptionStaticRemoteKey": true,
                "LocalBalance": 7000000000,
                "RemoteBalance": 3000000000,
                "FeePerKw": 15000,
                "UseTestHtlcs": false,
                "HtlcDescs": [
                ],
                "RemoteSigHex": "3045022100c3127b33dcc741dd6b05b1e63cbd1a9a7d816f37af9b6756fa2376b056f032370220408b96279808fe57eb7e463710804cdf4f108388bc5cf722d8c848d2c7f9f3b0",
                "LocalSigHex": "30440220616210b2cc4d3afb601013c373bbd8aac54febd9f15400379a8cb65ce7deca60022034236c010991beb7ff770510561ae8dc885b8d38d1947248c38f2ae055647142",
                "ExpectedCommitmentTxHex": "02000000000101bef67e4e2fb9ddeeb3461973cd4c62abb35050b1add772995b820b584a488489000000000038b02b8002c0c62d0000000000160014cc1b07838e387deacd0e5232e1e8b49f4c29e48454a56a00000000002200204adb4e2f00643db396dd120d4e7dc17625f5f2c11a40d857accc862d6b7dd80e04004730440220616210b2cc4d3afb601013c373bbd8aac54febd9f15400379a8cb65ce7deca60022034236c010991beb7ff770510561ae8dc885b8d38d1947248c38f2ae05564714201483045022100c3127b33dcc741dd6b05b1e63cbd1a9a7d816f37af9b6756fa2376b056f032370220408b96279808fe57eb7e463710804cdf4f108388bc5cf722d8c848d2c7f9f3b001475221023da092f6980e58d2c037173180e9a465476026ee50f96695963e8efe436f54eb21030e9f7b623d2ccc7c9bd44d66d5ce21ce504c0acf6385a132cec6d3c39fa711c152ae3e195220",
            },
            {
                "Name": "option_static_remotekey - commitment tx with all five HTLCs untrimmed (minimum feerate)",
                "OptionStaticRemoteKey": true,
                "LocalBalance": 6988000000,
                "RemoteBalance": 3000000000,
                "FeePerKw": 0,
                "UseTestHtlcs": true,
                "HtlcDescs": [
                    {
                        "RemoteSigHex": "3045022100d9e29616b8f3959f1d3d7f7ce893ffedcdc407717d0de8e37d808c91d3a7c50d022078c3033f6d00095c8720a4bc943c1b45727818c082e4e3ddbc6d3116435b624b",
                        "LocalSigHex": "30440220636de5682ef0c5b61f124ec74e8aa2461a69777521d6998295dcea36bc3338110220165285594b23c50b28b82df200234566628a27bcd17f7f14404bd865354eb3ce",
                        "ResolutionTxHex": "02000000000101ab84ff284f162cfbfef241f853b47d4368d171f9e2a1445160cd591c4c7d882b00000000000000000001e8030000000000002200204adb4e2f00643db396dd120d4e7dc17625f5f2c11a40d857accc862d6b7dd80e0500483045022100d9e29616b8f3959f1d3d7f7ce893ffedcdc407717d0de8e37d808c91d3a7c50d022078c3033f6d00095c8720a4bc943c1b45727818c082e4e3ddbc6d3116435b624b014730440220636de5682ef0c5b61f124ec74e8aa2461a69777521d6998295dcea36bc3338110220165285594b23c50b28b82df200234566628a27bcd17f7f14404bd865354eb3ce012000000000000000000000000000000000000000000000000000000000000000008a76a91414011f7254d96b819c76986c277d115efce6f7b58763ac67210394854aa6eab5b2a8122cc726e9dded053a2184d88256816826d6231c068d4a5b7c8201208763a914b8bcb07f6344b42ab04250c86a6e8b75d3fdbbc688527c21030d417a46946384f88d5f3337267c5e579765875dc4daca813e21734b140639e752ae677502f401b175ac686800000000"
                    },
                    {
                        "RemoteSigHex": "30440220649fe8b20e67e46cbb0d09b4acea87dbec001b39b08dee7bdd0b1f03922a8640022037c462dff79df501cecfdb12ea7f4de91f99230bb544726f6e04527b1f896004",
                        "LocalSigHex": "3045022100803159dee7935dba4a1d36a61055ce8fd62caa528573cc221ae288515405a252022029c59e7cffce374fe860100a4a63787e105c3cf5156d40b12dd53ff55ac8cf3f",
                        "ResolutionTxHex": "02000000000101ab84ff284f162cfbfef241f853b47d4368d171f9e2a1445160cd591c4c7d882b01000000000000000001d0070000000000002200204adb4e2f00643db396dd120d4e7dc17625f5f2c11a40d857accc862d6b7dd80e05004730440220649fe8b20e67e46cbb0d09b4acea87dbec001b39b08dee7bdd0b1f03922a8640022037c462dff79df501cecfdb12ea7f4de91f99230bb544726f6e04527b1f89600401483045022100803159dee7935dba4a1d36a61055ce8fd62caa528573cc221ae288515405a252022029c59e7cffce374fe860100a4a63787e105c3cf5156d40b12dd53ff55ac8cf3f01008576a91414011f7254d96b819c76986c277d115efce6f7b58763ac67210394854aa6eab5b2a8122cc726e9dded053a2184d88256816826d6231c068d4a5b7c820120876475527c21030d417a46946384f88d5f3337267c5e579765875dc4daca813e21734b140639e752ae67a914b43e1b38138a41b37f7cd9a1d274bc63e3a9b5d188ac6868f6010000"
                    },
                    {
                        "RemoteSigHex": "30440220770fc321e97a19f38985f2e7732dd9fe08d16a2efa4bcbc0429400a447faf49102204d40b417f3113e1b0944ae0986f517564ab4acd3d190503faf97a6e420d43352",
                        "LocalSigHex": "3045022100a437cc2ce77400ecde441b3398fea3c3ad8bdad8132be818227fe3c5b8345989022069d45e7fa0ae551ec37240845e2c561ceb2567eacf3076a6a43a502d05865faa",
                        "ResolutionTxHex": "02000000000101ab84ff284f162cfbfef241f853b47d4368d171f9e2a1445160cd591c4c7d882b02000000000000000001d0070000000000002200204adb4e2f00643db396dd120d4e7dc17625f5f2c11a40d857accc862d6b7dd80e05004730440220770fc321e97a19f38985f2e7732dd9fe08d16a2efa4bcbc0429400a447faf49102204d40b417f3113e1b0944ae0986f517564ab4acd3d190503faf97a6e420d4335201483045022100a437cc2ce77400ecde441b3398fea3c3ad8bdad8132be818227fe3c5b8345989022069d45e7fa0ae551ec37240845e2c561ceb2567eacf3076a6a43a502d05865faa012001010101010101010101010101010101010101010101010101010101010101018a76a91414011f7254d96b819c76986c277d115efce6f7b58763ac67210394854aa6eab5b2a8122cc726e9dded053a2184d88256816826d6231c068d4a5b7c8201208763a9144b6b2e5444c2639cc0fb7bcea5afba3f3cdce23988527c21030d417a46946384f88d5f3337267c5e579765875dc4daca813e21734b140639e752ae677502f501b175ac686800000000"
                    },
                    {
                        "RemoteSigHex": "304402207bcbf4f60a9829b05d2dbab84ed593e0291836be715dc7db6b72a64caf646af802201e489a5a84f7c5cc130398b841d138d031a5137ac8f4c49c770a4959dc3c1363",
                        "LocalSigHex": "304402203121d9b9c055f354304b016a36662ee99e1110d9501cb271b087ddb6f382c2c80220549882f3f3b78d9c492de47543cb9a697cecc493174726146536c5954dac7487",
                        "ResolutionTxHex": "02000000000101ab84ff284f162cfbfef241f853b47d4368d171f9e2a1445160cd591c4c7d882b03000000000000000001b80b0000000000002200204adb4e2f00643db396dd120d4e7dc17625f5f2c11a40d857accc862d6b7dd80e050047304402207bcbf4f60a9829b05d2dbab84ed593e0291836be715dc7db6b72a64caf646af802201e489a5a84f7c5cc130398b841d138d031a5137ac8f4c49c770a4959dc3c13630147304402203121d9b9c055f354304b016a36662ee99e1110d9501cb271b087ddb6f382c2c80220549882f3f3b78d9c492de47543cb9a697cecc493174726146536c5954dac748701008576a91414011f7254d96b819c76986c277d115efce6f7b58763ac67210394854aa6eab5b2a8122cc726e9dded053a2184d88256816826d6231c068d4a5b7c820120876475527c21030d417a46946384f88d5f3337267c5e579765875dc4daca813e21734b140639e752ae67a9148a486ff2e31d6158bf39e2608864d63fefd09d5b88ac6868f7010000"
                    },
                    {
                        "RemoteSigHex": "3044022076dca5cb81ba7e466e349b7128cdba216d4d01659e29b96025b9524aaf0d1899022060de85697b88b21c749702b7d2cfa7dfeaa1f472c8f1d7d9c23f2bf968464b87",
                        "LocalSigHex": "3045022100d9080f103cc92bac15ec42464a95f070c7fb6925014e673ee2ea1374d36a7f7502200c65294d22eb20d48564954d5afe04a385551919d8b2ddb4ae2459daaeee1d95",
                        "ResolutionTxHex": "02000000000101ab84ff284f162cfbfef241f853b47d4368d171f9e2a1445160cd591c4c7d882b04000000000000000001a00f0000000000002200204adb4e2f00643db396dd120d4e7dc17625f5f2c11a40d857accc862d6b7dd80e0500473044022076dca5cb81ba7e466e349b7128cdba216d4d01659e29b96025b9524aaf0d1899022060de85697b88b21c749702b7d2cfa7dfeaa1f472c8f1d7d9c23f2bf968464b8701483045022100d9080f103cc92bac15ec42464a95f070c7fb6925014e673ee2ea1374d36a7f7502200c65294d22eb20d48564954d5afe04a385551919d8b2ddb4ae2459daaeee1d95012004040404040404040404040404040404040404040404040404040404040404048a76a91414011f7254d96b819c76986c277d115efce6f7b58763ac67210394854aa6eab5b2a8122cc726e9dded053a2184d88256816826d6231c068d4a5b7c8201208763a91418bc1a114ccf9c052d3d23e28d3b0a9d1227434288527c21030d417a46946384f88d5f3337267c5e579765875dc4daca813e21734b140639e752ae677502f801b175ac686800000000"
                    },
                ],
                "RemoteSigHex": "3044022009b048187705a8cbc9ad73adbe5af148c3d012e1f067961486c822c7af08158c022006d66f3704cfab3eb2dc49dae24e4aa22a6910fc9b424007583204e3621af2e5",
                "LocalSigHex": "304402206fc2d1f10ea59951eefac0b4b7c396a3c3d87b71ff0b019796ef4535beaf36f902201765b0181e514d04f4c8ad75659d7037be26cdb3f8bb6f78fe61decef484c3ea",
                "ExpectedCommitmentTxHex": "02000000000101bef67e4e2fb9ddeeb3461973cd4c62abb35050b1add772995b820b584a488489000000000038b02b8007e80300000000000022002052bfef0479d7b293c27e0f1eb294bea154c63a3294ef092c19af51409bce0e2ad007000000000000220020403d394747cae42e98ff01734ad5c08f82ba123d3d9a620abda88989651e2ab5d007000000000000220020748eba944fedc8827f6b06bc44678f93c0f9e6078b35c6331ed31e75f8ce0c2db80b000000000000220020c20b5d1f8584fd90443e7b7b720136174fa4b9333c261d04dbbd012635c0f419a00f0000000000002200208c48d15160397c9731df9bc3b236656efb6665fbfe92b4a6878e88a499f741c4c0c62d0000000000160014cc1b07838e387deacd0e5232e1e8b49f4c29e484e0a06a00000000002200204adb4e2f00643db396dd120d4e7dc17625f5f2c11a40d857accc862d6b7dd80e040047304402206fc2d1f10ea59951eefac0b4b7c396a3c3d87b71ff0b019796ef4535beaf36f902201765b0181e514d04f4c8ad75659d7037be26cdb3f8bb6f78fe61decef484c3ea01473044022009b048187705a8cbc9ad73adbe5af148c3d012e1f067961486c822c7af08158c022006d66f3704cfab3eb2dc49dae24e4aa22a6910fc9b424007583204e3621af2e501475221023da092f6980e58d2c037173180e9a465476026ee50f96695963e8efe436f54eb21030e9f7b623d2ccc7c9bd44d66d5ce21ce504c0acf6385a132cec6d3c39fa711c152ae3e195220",
            },
            {
                "Name": "option_static_remotekey - simple commitment tx with no HTLCs",
                "OptionStaticRemoteKey": true,
                "LocalBalance": 7000000000,
                "RemoteBalance": 3000000000,
                "FeePerKw": 15000,
                "UseTestHtlcs": false,
                "HtlcDescs": [
                ],
                "RemoteSigHex": "3045022100c3127b33dcc741dd6b05b1e63cbd1a9a7d816f37af9b6756fa2376b056f032370220408b96279808fe57eb7e463710804cdf4f108388bc5cf722d8c848d2c7f9f3b0",
                "LocalSigHex": "30440220616210b2cc4d3afb601013c373bbd8aac54febd9f15400379a8cb65ce7deca60022034236c010991beb7ff770510561ae8dc885b8d38d1947248c38f2ae055647142",
                "ExpectedCommitmentTxHex": "02000000000101bef67e4e2fb9ddeeb3461973cd4c62abb35050b1add772995b820b584a488489000000000038b02b8002c0c62d0000000000160014cc1b07838e387deacd0e5232e1e8b49f4c29e48454a56a00000000002200204adb4e2f00643db396dd120d4e7dc17625f5f2c11a40d857accc862d6b7dd80e04004730440220616210b2cc4d3afb601013c373bbd8aac54febd9f15400379a8cb65ce7deca60022034236c010991beb7ff770510561ae8dc885b8d38d1947248c38f2ae05564714201483045022100c3127b33dcc741dd6b05b1e63cbd1a9a7d816f37af9b6756fa2376b056f032370220408b96279808fe57eb7e463710804cdf4f108388bc5cf722d8c848d2c7f9f3b001475221023da092f6980e58d2c037173180e9a465476026ee50f96695963e8efe436f54eb21030e9f7b623d2ccc7c9bd44d66d5ce21ce504c0acf6385a132cec6d3c39fa711c152ae3e195220",
            },
            {
                "Name": "option_static_remotekey - commitment tx with seven outputs untrimmed (maximum feerate)",
                "OptionStaticRemoteKey": true,
                "LocalBalance": 6988000000,
                "RemoteBalance": 3000000000,
                "FeePerKw": 647,
                "UseTestHtlcs": true,
                "HtlcDescs": [
                    {
                        "RemoteSigHex": "30450221008437627f9ad84ac67052e2a414a4367b8556fd1f94d8b02590f89f50525cd33502205b9c21ff6e7fc864f2352746ad8ba59182510819acb644e25b8a12fc37bbf24f",
                        "LocalSigHex": "30440220344b0deb055230d01703e6c7acd45853c4af2328b49b5d8af4f88a060733406602202ea64f2a43d5751edfe75503cbc35a62e3141b5ed032fa03360faf4ca66f670b",
                        "ResolutionTxHex": "020000000001012cfb3e4788c206881d38f2996b6cb2109b5935acb527d14bdaa7b908afa9b2fe0000000000000000000122020000000000002200204adb4e2f00643db396dd120d4e7dc17625f5f2c11a40d857accc862d6b7dd80e05004830450221008437627f9ad84ac67052e2a414a4367b8556fd1f94d8b02590f89f50525cd33502205b9c21ff6e7fc864f2352746ad8ba59182510819acb644e25b8a12fc37bbf24f014730440220344b0deb055230d01703e6c7acd45853c4af2328b49b5d8af4f88a060733406602202ea64f2a43d5751edfe75503cbc35a62e3141b5ed032fa03360faf4ca66f670b012000000000000000000000000000000000000000000000000000000000000000008a76a91414011f7254d96b819c76986c277d115efce6f7b58763ac67210394854aa6eab5b2a8122cc726e9dded053a2184d88256816826d6231c068d4a5b7c8201208763a914b8bcb07f6344b42ab04250c86a6e8b75d3fdbbc688527c21030d417a46946384f88d5f3337267c5e579765875dc4daca813e21734b140639e752ae677502f401b175ac686800000000"
                    },
                    {
                        "RemoteSigHex": "304402205a67f92bf6845cf2892b48d874ac1daf88a36495cf8a06f93d83180d930a6f75022031da1621d95c3f335cc06a3056cf960199dae600b7cf89088f65fc53cdbef28c",
                        "LocalSigHex": "30450221009e5e3822b0185c6799a95288c597b671d6cc69ab80f43740f00c6c3d0752bdda02206da947a74bd98f3175324dc56fdba86cc783703a120a6f0297537e60632f4c7f",
                        "ResolutionTxHex": "020000000001012cfb3e4788c206881d38f2996b6cb2109b5935acb527d14bdaa7b908afa9b2fe0100000000000000000124060000000000002200204adb4e2f00643db396dd120d4e7dc17625f5f2c11a40d857accc862d6b7dd80e050047304402205a67f92bf6845cf2892b48d874ac1daf88a36495cf8a06f93d83180d930a6f75022031da1621d95c3f335cc06a3056cf960199dae600b7cf89088f65fc53cdbef28c014830450221009e5e3822b0185c6799a95288c597b671d6cc69ab80f43740f00c6c3d0752bdda02206da947a74bd98f3175324dc56fdba86cc783703a120a6f0297537e60632f4c7f01008576a91414011f7254d96b819c76986c277d115efce6f7b58763ac67210394854aa6eab5b2a8122cc726e9dded053a2184d88256816826d6231c068d4a5b7c820120876475527c21030d417a46946384f88d5f3337267c5e579765875dc4daca813e21734b140639e752ae67a914b43e1b38138a41b37f7cd9a1d274bc63e3a9b5d188ac6868f6010000"
                    },
                    {
                        "RemoteSigHex": "30440220437e21766054a3eef7f65690c5bcfa9920babbc5af92b819f772f6ea96df6c7402207173622024bd97328cfb26c6665e25c2f5d67c319443ccdc60c903217005d8c8",
                        "LocalSigHex": "3045022100fcfc47e36b712624677626cef3dc1d67f6583bd46926a6398fe6b00b0c9a37760220525788257b187fc775c6370d04eadf34d06f3650a63f8df851cee0ecb47a1673",
                        "ResolutionTxHex": "020000000001012cfb3e4788c206881d38f2996b6cb2109b5935acb527d14bdaa7b908afa9b2fe020000000000000000010a060000000000002200204adb4e2f00643db396dd120d4e7dc17625f5f2c11a40d857accc862d6b7dd80e05004730440220437e21766054a3eef7f65690c5bcfa9920babbc5af92b819f772f6ea96df6c7402207173622024bd97328cfb26c6665e25c2f5d67c319443ccdc60c903217005d8c801483045022100fcfc47e36b712624677626cef3dc1d67f6583bd46926a6398fe6b00b0c9a37760220525788257b187fc775c6370d04eadf34d06f3650a63f8df851cee0ecb47a1673012001010101010101010101010101010101010101010101010101010101010101018a76a91414011f7254d96b819c76986c277d115efce6f7b58763ac67210394854aa6eab5b2a8122cc726e9dded053a2184d88256816826d6231c068d4a5b7c8201208763a9144b6b2e5444c2639cc0fb7bcea5afba3f3cdce23988527c21030d417a46946384f88d5f3337267c5e579765875dc4daca813e21734b140639e752ae677502f501b175ac686800000000"
                    },
                    {
                        "RemoteSigHex": "304402207436e10737e4df499fc051686d3e11a5bb2310e4d1f1e691d287cef66514791202207cb58e71a6b7a42dd001b7e3ae672ea4f71ea3e1cd412b742e9124abb0739c64",
                        "LocalSigHex": "3045022100e78211b8409afb7255ffe37337da87f38646f1faebbdd61bc1920d69e3ead67a02201a626305adfcd16bfb7e9340928d9b6305464eab4aa4c4a3af6646e9b9f69dee",
                        "ResolutionTxHex": "020000000001012cfb3e4788c206881d38f2996b6cb2109b5935acb527d14bdaa7b908afa9b2fe030000000000000000010c0a0000000000002200204adb4e2f00643db396dd120d4e7dc17625f5f2c11a40d857accc862d6b7dd80e050047304402207436e10737e4df499fc051686d3e11a5bb2310e4d1f1e691d287cef66514791202207cb58e71a6b7a42dd001b7e3ae672ea4f71ea3e1cd412b742e9124abb0739c6401483045022100e78211b8409afb7255ffe37337da87f38646f1faebbdd61bc1920d69e3ead67a02201a626305adfcd16bfb7e9340928d9b6305464eab4aa4c4a3af6646e9b9f69dee01008576a91414011f7254d96b819c76986c277d115efce6f7b58763ac67210394854aa6eab5b2a8122cc726e9dded053a2184d88256816826d6231c068d4a5b7c820120876475527c21030d417a46946384f88d5f3337267c5e579765875dc4daca813e21734b140639e752ae67a9148a486ff2e31d6158bf39e2608864d63fefd09d5b88ac6868f7010000"
                    },
                    {
                        "RemoteSigHex": "30450221009acd6a827a76bfee50806178dfe0495cd4e1d9c58279c194c7b01520fe68cb8d022024d439047c368883e570997a7d40f0b430cb5a742f507965e7d3063ae3feccca",
                        "LocalSigHex": "3044022048762cf546bbfe474f1536365ea7c416e3c0389d60558bc9412cb148fb6ab68202207215d7083b75c96ff9d2b08c59c34e287b66820f530b486a9aa4cdd9c347d5b9",
                        "ResolutionTxHex": "020000000001012cfb3e4788c206881d38f2996b6cb2109b5935acb527d14bdaa7b908afa9b2fe04000000000000000001da0d0000000000002200204adb4e2f00643db396dd120d4e7dc17625f5f2c11a40d857accc862d6b7dd80e05004830450221009acd6a827a76bfee50806178dfe0495cd4e1d9c58279c194c7b01520fe68cb8d022024d439047c368883e570997a7d40f0b430cb5a742f507965e7d3063ae3feccca01473044022048762cf546bbfe474f1536365ea7c416e3c0389d60558bc9412cb148fb6ab68202207215d7083b75c96ff9d2b08c59c34e287b66820f530b486a9aa4cdd9c347d5b9012004040404040404040404040404040404040404040404040404040404040404048a76a91414011f7254d96b819c76986c277d115efce6f7b58763ac67210394854aa6eab5b2a8122cc726e9dded053a2184d88256816826d6231c068d4a5b7c8201208763a91418bc1a114ccf9c052d3d23e28d3b0a9d1227434288527c21030d417a46946384f88d5f3337267c5e579765875dc4daca813e21734b140639e752ae677502f801b175ac686800000000"
                    },
                ],
                "RemoteSigHex": "3045022100a135f9e8a5ed25f7277446c67956b00ce6f610ead2bdec2c2f686155b7814772022059f1f6e1a8b336a68efcc1af3fe4d422d4827332b5b067501b099c47b7b5b5ee",
                "LocalSigHex": "30450221009ec15c687898bb4da8b3a833e5ab8bfc51ec6e9202aaa8e66611edfd4a85ed1102203d7183e45078b9735c93450bc3415d3e5a8c576141a711ec6ddcb4a893926bb7",
                "ExpectedCommitmentTxHex": "02000000000101bef67e4e2fb9ddeeb3461973cd4c62abb35050b1add772995b820b584a488489000000000038b02b8007e80300000000000022002052bfef0479d7b293c27e0f1eb294bea154c63a3294ef092c19af51409bce0e2ad007000000000000220020403d394747cae42e98ff01734ad5c08f82ba123d3d9a620abda88989651e2ab5d007000000000000220020748eba944fedc8827f6b06bc44678f93c0f9e6078b35c6331ed31e75f8ce0c2db80b000000000000220020c20b5d1f8584fd90443e7b7b720136174fa4b9333c261d04dbbd012635c0f419a00f0000000000002200208c48d15160397c9731df9bc3b236656efb6665fbfe92b4a6878e88a499f741c4c0c62d0000000000160014cc1b07838e387deacd0e5232e1e8b49f4c29e484e09c6a00000000002200204adb4e2f00643db396dd120d4e7dc17625f5f2c11a40d857accc862d6b7dd80e04004830450221009ec15c687898bb4da8b3a833e5ab8bfc51ec6e9202aaa8e66611edfd4a85ed1102203d7183e45078b9735c93450bc3415d3e5a8c576141a711ec6ddcb4a893926bb701483045022100a135f9e8a5ed25f7277446c67956b00ce6f610ead2bdec2c2f686155b7814772022059f1f6e1a8b336a68efcc1af3fe4d422d4827332b5b067501b099c47b7b5b5ee01475221023da092f6980e58d2c037173180e9a465476026ee50f96695963e8efe436f54eb21030e9f7b623d2ccc7c9bd44d66d5ce21ce504c0acf6385a132cec6d3c39fa711c152ae3e195220",
            },
            {
                "Name": "option_static_remotekey - commitment tx with six outputs untrimmed (minimum feerate)",
                "OptionStaticRemoteKey": true,
                "LocalBalance": 6988000000,
                "RemoteBalance": 3000000000,
                "FeePerKw": 648,
                "UseTestHtlcs": true,
                "HtlcDescs": [
                    {
                        "RemoteSigHex": "3045022100a031202f3be94678f0e998622ee95ebb6ada8da1e9a5110228b5e04a747351e4022010ca6a21e18314ed53cfaae3b1f51998552a61a468e596368829a50ce40110e0",
                        "LocalSigHex": "304502210097e1873b57267730154595187a34949d3744f52933070c74757005e61ce2112e02204ecfba2aa42d4f14bdf8bad4206bb97217b702e6c433e0e1b0ce6587e6d46ec6",
                        "ResolutionTxHex": "020000000001010f44041fdfba175987cf4e6135ba2a154e3b7fb96483dc0ed5efc0678e5b6bf10000000000000000000123060000000000002200204adb4e2f00643db396dd120d4e7dc17625f5f2c11a40d857accc862d6b7dd80e0500483045022100a031202f3be94678f0e998622ee95ebb6ada8da1e9a5110228b5e04a747351e4022010ca6a21e18314ed53cfaae3b1f51998552a61a468e596368829a50ce40110e00148304502210097e1873b57267730154595187a34949d3744f52933070c74757005e61ce2112e02204ecfba2aa42d4f14bdf8bad4206bb97217b702e6c433e0e1b0ce6587e6d46ec601008576a91414011f7254d96b819c76986c277d115efce6f7b58763ac67210394854aa6eab5b2a8122cc726e9dded053a2184d88256816826d6231c068d4a5b7c820120876475527c21030d417a46946384f88d5f3337267c5e579765875dc4daca813e21734b140639e752ae67a914b43e1b38138a41b37f7cd9a1d274bc63e3a9b5d188ac6868f6010000"
                    },
                    {
                        "RemoteSigHex": "304402202361012a634aee7835c5ecdd6413dcffa8f404b7e77364c792cff984e4ee71e90220715c5e90baa08daa45a7439b1ee4fa4843ed77b19c058240b69406606d384124",
                        "LocalSigHex": "3044022019de73b00f1d818fb388e83b2c8c31f6bce35ac624e215bc12f88f9dc33edf48022006ff814bb9f700ee6abc3294e146fac3efd4f13f0005236b41c0a946ee00c9ae",
                        "ResolutionTxHex": "020000000001010f44041fdfba175987cf4e6135ba2a154e3b7fb96483dc0ed5efc0678e5b6bf10100000000000000000109060000000000002200204adb4e2f00643db396dd120d4e7dc17625f5f2c11a40d857accc862d6b7dd80e050047304402202361012a634aee7835c5ecdd6413dcffa8f404b7e77364c792cff984e4ee71e90220715c5e90baa08daa45a7439b1ee4fa4843ed77b19c058240b69406606d38412401473044022019de73b00f1d818fb388e83b2c8c31f6bce35ac624e215bc12f88f9dc33edf48022006ff814bb9f700ee6abc3294e146fac3efd4f13f0005236b41c0a946ee00c9ae012001010101010101010101010101010101010101010101010101010101010101018a76a91414011f7254d96b819c76986c277d115efce6f7b58763ac67210394854aa6eab5b2a8122cc726e9dded053a2184d88256816826d6231c068d4a5b7c8201208763a9144b6b2e5444c2639cc0fb7bcea5afba3f3cdce23988527c21030d417a46946384f88d5f3337267c5e579765875dc4daca813e21734b140639e752ae677502f501b175ac686800000000"
                    },
                    {
                        "RemoteSigHex": "304402207e8e82cd71ed4febeb593732c260456836e97d81896153ecd2b3cf320ca6861702202dd4a30f68f98ced7cc56a36369ac1fdd978248c5ff4ed204fc00cc625532989",
                        "LocalSigHex": "3045022100bd0be6100c4fd8f102ec220e1b053e4c4e2ecca25615490150007b40d314dc3902201a1e0ea266965b43164d9e6576f58fa6726d42883dd1c3996d2925c2e2260796",
                        "ResolutionTxHex": "020000000001010f44041fdfba175987cf4e6135ba2a154e3b7fb96483dc0ed5efc0678e5b6bf1020000000000000000010b0a0000000000002200204adb4e2f00643db396dd120d4e7dc17625f5f2c11a40d857accc862d6b7dd80e050047304402207e8e82cd71ed4febeb593732c260456836e97d81896153ecd2b3cf320ca6861702202dd4a30f68f98ced7cc56a36369ac1fdd978248c5ff4ed204fc00cc62553298901483045022100bd0be6100c4fd8f102ec220e1b053e4c4e2ecca25615490150007b40d314dc3902201a1e0ea266965b43164d9e6576f58fa6726d42883dd1c3996d2925c2e226079601008576a91414011f7254d96b819c76986c277d115efce6f7b58763ac67210394854aa6eab5b2a8122cc726e9dded053a2184d88256816826d6231c068d4a5b7c820120876475527c21030d417a46946384f88d5f3337267c5e579765875dc4daca813e21734b140639e752ae67a9148a486ff2e31d6158bf39e2608864d63fefd09d5b88ac6868f7010000"
                    },
                    {
                        "RemoteSigHex": "3044022024cd52e4198c8ae0e414a86d86b5a65ea7450f2eb4e783096736d93395eca5ce022078f0094745b45be4d4b2b04dd5978c9e66ba49109e5704403e84aaf5f387d6be",
                        "LocalSigHex": "3045022100bbfb9d0a946d420807c86e985d636cceb16e71c3694ed186316251a00cbd807202207773223f9a337e145f64673825be9b30d07ef1542c82188b264bedcf7cda78c6",
                        "ResolutionTxHex": "020000000001010f44041fdfba175987cf4e6135ba2a154e3b7fb96483dc0ed5efc0678e5b6bf103000000000000000001d90d0000000000002200204adb4e2f00643db396dd120d4e7dc17625f5f2c11a40d857accc862d6b7dd80e0500473044022024cd52e4198c8ae0e414a86d86b5a65ea7450f2eb4e783096736d93395eca5ce022078f0094745b45be4d4b2b04dd5978c9e66ba49109e5704403e84aaf5f387d6be01483045022100bbfb9d0a946d420807c86e985d636cceb16e71c3694ed186316251a00cbd807202207773223f9a337e145f64673825be9b30d07ef1542c82188b264bedcf7cda78c6012004040404040404040404040404040404040404040404040404040404040404048a76a91414011f7254d96b819c76986c277d115efce6f7b58763ac67210394854aa6eab5b2a8122cc726e9dded053a2184d88256816826d6231c068d4a5b7c8201208763a91418bc1a114ccf9c052d3d23e28d3b0a9d1227434288527c21030d417a46946384f88d5f3337267c5e579765875dc4daca813e21734b140639e752ae677502f801b175ac686800000000"
                    },
                ],
                "RemoteSigHex": "304402203948f900a5506b8de36a4d8502f94f21dd84fd9c2314ab427d52feaa7a0a19f2022059b6a37a4adaa2c5419dc8aea63c6e2a2ec4c4bde46207f6dc1fcd22152fc6e5",
                "LocalSigHex": "3045022100b15f72908ba3382a34ca5b32519240a22300cc6015b6f9418635fb41f3d01d8802207adb331b9ed1575383dca0f2355e86c173802feecf8298fbea53b9d4610583e9",
                "ExpectedCommitmentTxHex": "02000000000101bef67e4e2fb9ddeeb3461973cd4c62abb35050b1add772995b820b584a488489000000000038b02b8006d007000000000000220020403d394747cae42e98ff01734ad5c08f82ba123d3d9a620abda88989651e2ab5d007000000000000220020748eba944fedc8827f6b06bc44678f93c0f9e6078b35c6331ed31e75f8ce0c2db80b000000000000220020c20b5d1f8584fd90443e7b7b720136174fa4b9333c261d04dbbd012635c0f419a00f0000000000002200208c48d15160397c9731df9bc3b236656efb6665fbfe92b4a6878e88a499f741c4c0c62d0000000000160014cc1b07838e387deacd0e5232e1e8b49f4c29e4844e9d6a00000000002200204adb4e2f00643db396dd120d4e7dc17625f5f2c11a40d857accc862d6b7dd80e0400483045022100b15f72908ba3382a34ca5b32519240a22300cc6015b6f9418635fb41f3d01d8802207adb331b9ed1575383dca0f2355e86c173802feecf8298fbea53b9d4610583e90147304402203948f900a5506b8de36a4d8502f94f21dd84fd9c2314ab427d52feaa7a0a19f2022059b6a37a4adaa2c5419dc8aea63c6e2a2ec4c4bde46207f6dc1fcd22152fc6e501475221023da092f6980e58d2c037173180e9a465476026ee50f96695963e8efe436f54eb21030e9f7b623d2ccc7c9bd44d66d5ce21ce504c0acf6385a132cec6d3c39fa711c152ae3e195220",
            },
            {
                "Name": "option_static_remotekey - commitment tx with six outputs untrimmed (maximum feerate)",
                "OptionStaticRemoteKey": true,
                "LocalBalance": 6988000000,
                "RemoteBalance": 3000000000,
                "FeePerKw": 2069,
                "UseTestHtlcs": true,
                "HtlcDescs": [
                    {
                        "RemoteSigHex": "3045022100f33513ee38abf1c582876f921f8fddc06acff48e04515532a32d3938de938ffd02203aa308a2c1863b7d6fdf53159a1465bf2e115c13152546cc5d74483ceaa7f699",
                        "LocalSigHex": "3045022100a637902a5d4c9ba9e7c472a225337d5aac9e2e3f6744f76e237132e7619ba0400220035c60d784a031c0d9f6df66b7eab8726a5c25397399ee4aa960842059eb3f9d",
                        "ResolutionTxHex": "02000000000101adbe717a63fb658add30ada1e6e12ed257637581898abe475c11d7bbcd65bd4d0000000000000000000175020000000000002200204adb4e2f00643db396dd120d4e7dc17625f5f2c11a40d857accc862d6b7dd80e0500483045022100f33513ee38abf1c582876f921f8fddc06acff48e04515532a32d3938de938ffd02203aa308a2c1863b7d6fdf53159a1465bf2e115c13152546cc5d74483ceaa7f69901483045022100a637902a5d4c9ba9e7c472a225337d5aac9e2e3f6744f76e237132e7619ba0400220035c60d784a031c0d9f6df66b7eab8726a5c25397399ee4aa960842059eb3f9d01008576a91414011f7254d96b819c76986c277d115efce6f7b58763ac67210394854aa6eab5b2a8122cc726e9dded053a2184d88256816826d6231c068d4a5b7c820120876475527c21030d417a46946384f88d5f3337267c5e579765875dc4daca813e21734b140639e752ae67a914b43e1b38138a41b37f7cd9a1d274bc63e3a9b5d188ac6868f6010000"
                    },
                    {
                        "RemoteSigHex": "3045022100ce07682cf4b90093c22dc2d9ab2a77ad6803526b655ef857221cc96af5c9e0bf02200f501cee22e7a268af40b555d15a8237c9f36ad67ef1841daf9f6a0267b1e6df",
                        "LocalSigHex": "3045022100e57e46234f8782d3ff7aa593b4f7446fb5316c842e693dc63ee324fd49f6a1c302204a2f7b44c48bd26e1554422afae13153eb94b29d3687b733d18930615fb2db61",
                        "ResolutionTxHex": "02000000000101adbe717a63fb658add30ada1e6e12ed257637581898abe475c11d7bbcd65bd4d0100000000000000000122020000000000002200204adb4e2f00643db396dd120d4e7dc17625f5f2c11a40d857accc862d6b7dd80e0500483045022100ce07682cf4b90093c22dc2d9ab2a77ad6803526b655ef857221cc96af5c9e0bf02200f501cee22e7a268af40b555d15a8237c9f36ad67ef1841daf9f6a0267b1e6df01483045022100e57e46234f8782d3ff7aa593b4f7446fb5316c842e693dc63ee324fd49f6a1c302204a2f7b44c48bd26e1554422afae13153eb94b29d3687b733d18930615fb2db61012001010101010101010101010101010101010101010101010101010101010101018a76a91414011f7254d96b819c76986c277d115efce6f7b58763ac67210394854aa6eab5b2a8122cc726e9dded053a2184d88256816826d6231c068d4a5b7c8201208763a9144b6b2e5444c2639cc0fb7bcea5afba3f3cdce23988527c21030d417a46946384f88d5f3337267c5e579765875dc4daca813e21734b140639e752ae677502f501b175ac686800000000"
                    },
                    {
                        "RemoteSigHex": "3045022100e3e35492e55f82ec0bc2f317ffd7a486d1f7024330fe9743c3559fc39f32ef0c02203d1d4db651fc388a91d5ad8ecdd8e83673063bc8eefe27cfd8c189090e3a23e0",
                        "LocalSigHex": "3044022068613fb1b98eb3aec7f44c5b115b12343c2f066c4277c82b5f873dfe68f37f50022028109b4650f3f528ca4bfe9a467aff2e3e43893b61b5159157119d5d95cf1c18",
                        "ResolutionTxHex": "02000000000101adbe717a63fb658add30ada1e6e12ed257637581898abe475c11d7bbcd65bd4d020000000000000000015d060000000000002200204adb4e2f00643db396dd120d4e7dc17625f5f2c11a40d857accc862d6b7dd80e0500483045022100e3e35492e55f82ec0bc2f317ffd7a486d1f7024330fe9743c3559fc39f32ef0c02203d1d4db651fc388a91d5ad8ecdd8e83673063bc8eefe27cfd8c189090e3a23e001473044022068613fb1b98eb3aec7f44c5b115b12343c2f066c4277c82b5f873dfe68f37f50022028109b4650f3f528ca4bfe9a467aff2e3e43893b61b5159157119d5d95cf1c1801008576a91414011f7254d96b819c76986c277d115efce6f7b58763ac67210394854aa6eab5b2a8122cc726e9dded053a2184d88256816826d6231c068d4a5b7c820120876475527c21030d417a46946384f88d5f3337267c5e579765875dc4daca813e21734b140639e752ae67a9148a486ff2e31d6158bf39e2608864d63fefd09d5b88ac6868f7010000"
                    },
                    {
                        "RemoteSigHex": "304402207475aeb0212ef9bf5130b60937817ad88c9a87976988ef1f323f026148cc4a850220739fea17ad3257dcad72e509c73eebe86bee30b178467b9fdab213d631b109df",
                        "LocalSigHex": "3045022100d315522e09e7d53d2a659a79cb67fef56d6c4bddf3f46df6772d0d20a7beb7c8022070bcc17e288607b6a72be0bd83368bb6d53488db266c1cdb4d72214e4f02ac33",
                        "ResolutionTxHex": "02000000000101adbe717a63fb658add30ada1e6e12ed257637581898abe475c11d7bbcd65bd4d03000000000000000001f2090000000000002200204adb4e2f00643db396dd120d4e7dc17625f5f2c11a40d857accc862d6b7dd80e050047304402207475aeb0212ef9bf5130b60937817ad88c9a87976988ef1f323f026148cc4a850220739fea17ad3257dcad72e509c73eebe86bee30b178467b9fdab213d631b109df01483045022100d315522e09e7d53d2a659a79cb67fef56d6c4bddf3f46df6772d0d20a7beb7c8022070bcc17e288607b6a72be0bd83368bb6d53488db266c1cdb4d72214e4f02ac33012004040404040404040404040404040404040404040404040404040404040404048a76a91414011f7254d96b819c76986c277d115efce6f7b58763ac67210394854aa6eab5b2a8122cc726e9dded053a2184d88256816826d6231c068d4a5b7c8201208763a91418bc1a114ccf9c052d3d23e28d3b0a9d1227434288527c21030d417a46946384f88d5f3337267c5e579765875dc4daca813e21734b140639e752ae677502f801b175ac686800000000"
                    },
                ],
                "RemoteSigHex": "304502210090b96a2498ce0c0f2fadbec2aab278fed54c1a7838df793ec4d2c78d96ec096202204fdd439c50f90d483baa7b68feeef4bd33bc277695405447bcd0bfb2ca34d7bc",
                "LocalSigHex": "3045022100ad9a9bbbb75d506ca3b716b336ee3cf975dd7834fcf129d7dd188146eb58a8b4022061a759ee417339f7fe2ea1e8deb83abb6a74db31a09b7648a932a639cda23e33",
                "ExpectedCommitmentTxHex": "02000000000101bef67e4e2fb9ddeeb3461973cd4c62abb35050b1add772995b820b584a488489000000000038b02b8006d007000000000000220020403d394747cae42e98ff01734ad5c08f82ba123d3d9a620abda88989651e2ab5d007000000000000220020748eba944fedc8827f6b06bc44678f93c0f9e6078b35c6331ed31e75f8ce0c2db80b000000000000220020c20b5d1f8584fd90443e7b7b720136174fa4b9333c261d04dbbd012635c0f419a00f0000000000002200208c48d15160397c9731df9bc3b236656efb6665fbfe92b4a6878e88a499f741c4c0c62d0000000000160014cc1b07838e387deacd0e5232e1e8b49f4c29e48477956a00000000002200204adb4e2f00643db396dd120d4e7dc17625f5f2c11a40d857accc862d6b7dd80e0400483045022100ad9a9bbbb75d506ca3b716b336ee3cf975dd7834fcf129d7dd188146eb58a8b4022061a759ee417339f7fe2ea1e8deb83abb6a74db31a09b7648a932a639cda23e330148304502210090b96a2498ce0c0f2fadbec2aab278fed54c1a7838df793ec4d2c78d96ec096202204fdd439c50f90d483baa7b68feeef4bd33bc277695405447bcd0bfb2ca34d7bc01475221023da092f6980e58d2c037173180e9a465476026ee50f96695963e8efe436f54eb21030e9f7b623d2ccc7c9bd44d66d5ce21ce504c0acf6385a132cec6d3c39fa711c152ae3e195220",
            },
             {
                "Name": "option_static_remotekey - commitment tx with five outputs untrimmed (minimum feerate)",
                "OptionStaticRemoteKey": true,
                "LocalBalance": 6988000000,
                "RemoteBalance": 3000000000,
                "FeePerKw": 2070,
                "UseTestHtlcs": true,
                "HtlcDescs": [
                    {
                        "RemoteSigHex": "304402205f6b6d12d8d2529fb24f4445630566cf4abbd0f9330ab6c2bdb94222d6a2a0c502202f556258ae6f05b193749e4c541dfcc13b525a5422f6291f073f15617ba8579b",
                        "LocalSigHex": "30440220150b11069454da70caf2492ded9e0065c9a57f25ac2a4c52657b1d15b6c6ed85022068a38833b603c8892717206383611bad210f1cbb4b1f87ea29c6c65b9e1cb3e5",
                        "ResolutionTxHex": "02000000000101403ad7602b43293497a3a2235a12ecefda4f3a1f1d06e49b1786d945685de1ff0000000000000000000174020000000000002200204adb4e2f00643db396dd120d4e7dc17625f5f2c11a40d857accc862d6b7dd80e050047304402205f6b6d12d8d2529fb24f4445630566cf4abbd0f9330ab6c2bdb94222d6a2a0c502202f556258ae6f05b193749e4c541dfcc13b525a5422f6291f073f15617ba8579b014730440220150b11069454da70caf2492ded9e0065c9a57f25ac2a4c52657b1d15b6c6ed85022068a38833b603c8892717206383611bad210f1cbb4b1f87ea29c6c65b9e1cb3e501008576a91414011f7254d96b819c76986c277d115efce6f7b58763ac67210394854aa6eab5b2a8122cc726e9dded053a2184d88256816826d6231c068d4a5b7c820120876475527c21030d417a46946384f88d5f3337267c5e579765875dc4daca813e21734b140639e752ae67a914b43e1b38138a41b37f7cd9a1d274bc63e3a9b5d188ac6868f6010000"
                    },
                    {
                        "RemoteSigHex": "3045022100f960dfb1c9aee7ce1437efa65b523e399383e8149790e05d8fed27ff6e42fe0002202fe8613e062ffe0b0c518cc4101fba1c6de70f64a5bcc7ae663f2efae43b8546",
                        "LocalSigHex": "30450221009a6ed18e6873bc3644332a6ee21c152a5b102821865350df7a8c74451a51f9f2022050d801fb4895d7d7fbf452824c0168347f5c0cbe821cf6a97a63af5b8b2563c6",
                        "ResolutionTxHex": "02000000000101403ad7602b43293497a3a2235a12ecefda4f3a1f1d06e49b1786d945685de1ff010000000000000000015c060000000000002200204adb4e2f00643db396dd120d4e7dc17625f5f2c11a40d857accc862d6b7dd80e0500483045022100f960dfb1c9aee7ce1437efa65b523e399383e8149790e05d8fed27ff6e42fe0002202fe8613e062ffe0b0c518cc4101fba1c6de70f64a5bcc7ae663f2efae43b8546014830450221009a6ed18e6873bc3644332a6ee21c152a5b102821865350df7a8c74451a51f9f2022050d801fb4895d7d7fbf452824c0168347f5c0cbe821cf6a97a63af5b8b2563c601008576a91414011f7254d96b819c76986c277d115efce6f7b58763ac67210394854aa6eab5b2a8122cc726e9dded053a2184d88256816826d6231c068d4a5b7c820120876475527c21030d417a46946384f88d5f3337267c5e579765875dc4daca813e21734b140639e752ae67a9148a486ff2e31d6158bf39e2608864d63fefd09d5b88ac6868f7010000"
                    },
                    {
                        "RemoteSigHex": "3045022100ae5fc7717ae684bc1fcf9020854e5dbe9842c9e7472879ac06ff95ac2bb10e4e022057728ada4c00083a3e65493fb5d50a232165948a1a0f530ef63185c2c8c56504",
                        "LocalSigHex": "30440220408ad3009827a8fccf774cb285587686bfb2ed041f89a89453c311ce9c8ee0f902203c7392d9f8306d3a46522a66bd2723a7eb2628cb2d9b34d4c104f1766bf37502",
                        "ResolutionTxHex": "02000000000101403ad7602b43293497a3a2235a12ecefda4f3a1f1d06e49b1786d945685de1ff02000000000000000001f1090000000000002200204adb4e2f00643db396dd120d4e7dc17625f5f2c11a40d857accc862d6b7dd80e0500483045022100ae5fc7717ae684bc1fcf9020854e5dbe9842c9e7472879ac06ff95ac2bb10e4e022057728ada4c00083a3e65493fb5d50a232165948a1a0f530ef63185c2c8c56504014730440220408ad3009827a8fccf774cb285587686bfb2ed041f89a89453c311ce9c8ee0f902203c7392d9f8306d3a46522a66bd2723a7eb2628cb2d9b34d4c104f1766bf37502012004040404040404040404040404040404040404040404040404040404040404048a76a91414011f7254d96b819c76986c277d115efce6f7b58763ac67210394854aa6eab5b2a8122cc726e9dded053a2184d88256816826d6231c068d4a5b7c8201208763a91418bc1a114ccf9c052d3d23e28d3b0a9d1227434288527c21030d417a46946384f88d5f3337267c5e579765875dc4daca813e21734b140639e752ae677502f801b175ac686800000000"
                    },
                ],
                "RemoteSigHex": "304402204ca1ba260dee913d318271d86e10ca0f5883026fb5653155cff600fb40895223022037b145204b7054a40e08bb1fefbd826f827b40838d3e501423bcc57924bcb50c",
                "LocalSigHex": "3044022001014419b5ba00e083ac4e0a85f19afc848aacac2d483b4b525d15e2ae5adbfe022015ebddad6ee1e72b47cb09f3e78459da5be01ccccd95dceca0e056a00cc773c1",
                "ExpectedCommitmentTxHex": "02000000000101bef67e4e2fb9ddeeb3461973cd4c62abb35050b1add772995b820b584a488489000000000038b02b8005d007000000000000220020403d394747cae42e98ff01734ad5c08f82ba123d3d9a620abda88989651e2ab5b80b000000000000220020c20b5d1f8584fd90443e7b7b720136174fa4b9333c261d04dbbd012635c0f419a00f0000000000002200208c48d15160397c9731df9bc3b236656efb6665fbfe92b4a6878e88a499f741c4c0c62d0000000000160014cc1b07838e387deacd0e5232e1e8b49f4c29e484da966a00000000002200204adb4e2f00643db396dd120d4e7dc17625f5f2c11a40d857accc862d6b7dd80e0400473044022001014419b5ba00e083ac4e0a85f19afc848aacac2d483b4b525d15e2ae5adbfe022015ebddad6ee1e72b47cb09f3e78459da5be01ccccd95dceca0e056a00cc773c10147304402204ca1ba260dee913d318271d86e10ca0f5883026fb5653155cff600fb40895223022037b145204b7054a40e08bb1fefbd826f827b40838d3e501423bcc57924bcb50c01475221023da092f6980e58d2c037173180e9a465476026ee50f96695963e8efe436f54eb21030e9f7b623d2ccc7c9bd44d66d5ce21ce504c0acf6385a132cec6d3c39fa711c152ae3e195220",
            },
            {
                "Name": "option_static_remotekey - commitment tx with five outputs untrimmed (maximum feerate)",
                "OptionStaticRemoteKey": true,
                "LocalBalance": 6988000000,
                "RemoteBalance": 3000000000,
                "FeePerKw": 2194,
                "UseTestHtlcs": true,
                "HtlcDescs": [
                    {
                        "RemoteSigHex": "3045022100939726680351a7856c1bc386d4a1f422c7d29bd7b56afc139570f508474e6c40022023175a799ccf44c017fbaadb924c40b2a12115a5b7d0dfd3228df803a2de8450",
                        "LocalSigHex": "304502210099c98c2edeeee6ec0fb5f3bea8b79bb016a2717afa9b5072370f34382de281d302206f5e2980a995e045cf90a547f0752a7ee99d48547bc135258fe7bc07e0154301",
                        "ResolutionTxHex": "02000000000101153cd825fdb3aa624bfe513e8031d5d08c5e582fb3d1d1fe8faf27d3eed410cd0000000000000000000122020000000000002200204adb4e2f00643db396dd120d4e7dc17625f5f2c11a40d857accc862d6b7dd80e0500483045022100939726680351a7856c1bc386d4a1f422c7d29bd7b56afc139570f508474e6c40022023175a799ccf44c017fbaadb924c40b2a12115a5b7d0dfd3228df803a2de84500148304502210099c98c2edeeee6ec0fb5f3bea8b79bb016a2717afa9b5072370f34382de281d302206f5e2980a995e045cf90a547f0752a7ee99d48547bc135258fe7bc07e015430101008576a91414011f7254d96b819c76986c277d115efce6f7b58763ac67210394854aa6eab5b2a8122cc726e9dded053a2184d88256816826d6231c068d4a5b7c820120876475527c21030d417a46946384f88d5f3337267c5e579765875dc4daca813e21734b140639e752ae67a914b43e1b38138a41b37f7cd9a1d274bc63e3a9b5d188ac6868f6010000"
                    },
                    {
                        "RemoteSigHex": "3044022021bb883bf324553d085ba2e821cad80c28ef8b303dbead8f98e548783c02d1600220638f9ef2a9bba25869afc923f4b5dc38be3bb459f9efa5d869392d5f7779a4a0",
                        "LocalSigHex": "3045022100fd85bd7697b89c08ec12acc8ba89b23090637d83abd26ca37e01ae93e67c367302202b551fe69386116c47f984aab9c8dfd25d864dcde5d3389cfbef2447a85c4b77",
                        "ResolutionTxHex": "02000000000101153cd825fdb3aa624bfe513e8031d5d08c5e582fb3d1d1fe8faf27d3eed410cd010000000000000000010a060000000000002200204adb4e2f00643db396dd120d4e7dc17625f5f2c11a40d857accc862d6b7dd80e0500473044022021bb883bf324553d085ba2e821cad80c28ef8b303dbead8f98e548783c02d1600220638f9ef2a9bba25869afc923f4b5dc38be3bb459f9efa5d869392d5f7779a4a001483045022100fd85bd7697b89c08ec12acc8ba89b23090637d83abd26ca37e01ae93e67c367302202b551fe69386116c47f984aab9c8dfd25d864dcde5d3389cfbef2447a85c4b7701008576a91414011f7254d96b819c76986c277d115efce6f7b58763ac67210394854aa6eab5b2a8122cc726e9dded053a2184d88256816826d6231c068d4a5b7c820120876475527c21030d417a46946384f88d5f3337267c5e579765875dc4daca813e21734b140639e752ae67a9148a486ff2e31d6158bf39e2608864d63fefd09d5b88ac6868f7010000"
                    },
                    {
                        "RemoteSigHex": "3045022100c9e6f0454aa598b905a35e641a70cc9f67b5f38cc4b00843a041238c4a9f1c4a0220260a2822a62da97e44583e837245995ca2e36781769c52f19e498efbdcca262b",
                        "LocalSigHex": "30450221008a9f2ea24cd455c2b64c1472a5fa83865b0a5f49a62b661801e884cf2849af8302204d44180e50bf6adfcf1c1e581d75af91aba4e28681ce4a5ee5f3cbf65eca10f3",
                        "ResolutionTxHex": "02000000000101153cd825fdb3aa624bfe513e8031d5d08c5e582fb3d1d1fe8faf27d3eed410cd020000000000000000019a090000000000002200204adb4e2f00643db396dd120d4e7dc17625f5f2c11a40d857accc862d6b7dd80e0500483045022100c9e6f0454aa598b905a35e641a70cc9f67b5f38cc4b00843a041238c4a9f1c4a0220260a2822a62da97e44583e837245995ca2e36781769c52f19e498efbdcca262b014830450221008a9f2ea24cd455c2b64c1472a5fa83865b0a5f49a62b661801e884cf2849af8302204d44180e50bf6adfcf1c1e581d75af91aba4e28681ce4a5ee5f3cbf65eca10f3012004040404040404040404040404040404040404040404040404040404040404048a76a91414011f7254d96b819c76986c277d115efce6f7b58763ac67210394854aa6eab5b2a8122cc726e9dded053a2184d88256816826d6231c068d4a5b7c8201208763a91418bc1a114ccf9c052d3d23e28d3b0a9d1227434288527c21030d417a46946384f88d5f3337267c5e579765875dc4daca813e21734b140639e752ae677502f801b175ac686800000000"
                    },
                ],
                "RemoteSigHex": "304402204bb3d6e279d71d9da414c82de42f1f954267c762b2e2eb8b76bc3be4ea07d4b0022014febc009c5edc8c3fc5d94015de163200f780046f1c293bfed8568f08b70fb3",
                "LocalSigHex": "3044022072c2e2b1c899b2242656a537dde2892fa3801be0d6df0a87836c550137acde8302201654aa1974d37a829083c3ba15088689f30b56d6a4f6cb14c7bad0ee3116d398",
                "ExpectedCommitmentTxHex": "02000000000101bef67e4e2fb9ddeeb3461973cd4c62abb35050b1add772995b820b584a488489000000000038b02b8005d007000000000000220020403d394747cae42e98ff01734ad5c08f82ba123d3d9a620abda88989651e2ab5b80b000000000000220020c20b5d1f8584fd90443e7b7b720136174fa4b9333c261d04dbbd012635c0f419a00f0000000000002200208c48d15160397c9731df9bc3b236656efb6665fbfe92b4a6878e88a499f741c4c0c62d0000000000160014cc1b07838e387deacd0e5232e1e8b49f4c29e48440966a00000000002200204adb4e2f00643db396dd120d4e7dc17625f5f2c11a40d857accc862d6b7dd80e0400473044022072c2e2b1c899b2242656a537dde2892fa3801be0d6df0a87836c550137acde8302201654aa1974d37a829083c3ba15088689f30b56d6a4f6cb14c7bad0ee3116d3980147304402204bb3d6e279d71d9da414c82de42f1f954267c762b2e2eb8b76bc3be4ea07d4b0022014febc009c5edc8c3fc5d94015de163200f780046f1c293bfed8568f08b70fb301475221023da092f6980e58d2c037173180e9a465476026ee50f96695963e8efe436f54eb21030e9f7b623d2ccc7c9bd44d66d5ce21ce504c0acf6385a132cec6d3c39fa711c152ae3e195220",
            },
            {
                "Name": "option_static_remotekey - commitment tx with four outputs untrimmed (minimum feerate)",
                "OptionStaticRemoteKey": true,
                "LocalBalance": 6988000000,
                "RemoteBalance": 3000000000,
                "FeePerKw": 2195,
                "UseTestHtlcs": true,
                "HtlcDescs": [
                    {
                        "RemoteSigHex": "3045022100e57b845066a06ee7c2cbfc29eabffe52daa9bf6f6de760066d04df9f9b250e0002202ffb197f0e6e0a77a75a9aff27014bd3de83b7f748d7efef986abe655e1dd50e",
                        "LocalSigHex": "3045022100ecc8c6529d0b2316d046f0f0757c1e1c25a636db168ec4f3aa1b9278df685dc0022067ae6b65e936f1337091f7b18a15935b608c5f2cdddb2f892ed0babfdd376d76",
                        "ResolutionTxHex": "020000000001018130a10f09b13677ba2885a8bca32860f3a952e5912b829a473639b5a2c07b900000000000000000000109060000000000002200204adb4e2f00643db396dd120d4e7dc17625f5f2c11a40d857accc862d6b7dd80e0500483045022100e57b845066a06ee7c2cbfc29eabffe52daa9bf6f6de760066d04df9f9b250e0002202ffb197f0e6e0a77a75a9aff27014bd3de83b7f748d7efef986abe655e1dd50e01483045022100ecc8c6529d0b2316d046f0f0757c1e1c25a636db168ec4f3aa1b9278df685dc0022067ae6b65e936f1337091f7b18a15935b608c5f2cdddb2f892ed0babfdd376d7601008576a91414011f7254d96b819c76986c277d115efce6f7b58763ac67210394854aa6eab5b2a8122cc726e9dded053a2184d88256816826d6231c068d4a5b7c820120876475527c21030d417a46946384f88d5f3337267c5e579765875dc4daca813e21734b140639e752ae67a9148a486ff2e31d6158bf39e2608864d63fefd09d5b88ac6868f7010000"
                    },
                    {
                        "RemoteSigHex": "3045022100d193b7ecccad8057571620a0b1ffa6c48e9483311723b59cf536043b20bc51550220546d4bd37b3b101ecda14f6c907af46ec391abce1cd9c7ce22b1a62b534f2f2a",
                        "LocalSigHex": "3044022014d66f11f9cacf923807eba49542076c5fe5cccf252fb08fe98c78ef3ca6ab5402201b290dbe043cc512d9d78de074a5a129b8759bc6a6c546b190d120b690bd6e82",
                        "ResolutionTxHex": "020000000001018130a10f09b13677ba2885a8bca32860f3a952e5912b829a473639b5a2c07b900100000000000000000199090000000000002200204adb4e2f00643db396dd120d4e7dc17625f5f2c11a40d857accc862d6b7dd80e0500483045022100d193b7ecccad8057571620a0b1ffa6c48e9483311723b59cf536043b20bc51550220546d4bd37b3b101ecda14f6c907af46ec391abce1cd9c7ce22b1a62b534f2f2a01473044022014d66f11f9cacf923807eba49542076c5fe5cccf252fb08fe98c78ef3ca6ab5402201b290dbe043cc512d9d78de074a5a129b8759bc6a6c546b190d120b690bd6e82012004040404040404040404040404040404040404040404040404040404040404048a76a91414011f7254d96b819c76986c277d115efce6f7b58763ac67210394854aa6eab5b2a8122cc726e9dded053a2184d88256816826d6231c068d4a5b7c8201208763a91418bc1a114ccf9c052d3d23e28d3b0a9d1227434288527c21030d417a46946384f88d5f3337267c5e579765875dc4daca813e21734b140639e752ae677502f801b175ac686800000000"
                    },
                ],
                "RemoteSigHex": "304402201a8c1b1f9671cd9e46c7323a104d7047cc48d3ee80d40d4512e0c72b8dc65666022066d7f9a2ce18c9eb22d2739ffcce05721c767f9b607622a31b6ea5793ddce403",
                "LocalSigHex": "3044022044d592025b610c0d678f65032e87035cdfe89d1598c522cc32524ae8172417c30220749fef9d5b2ae8cdd91ece442ba8809bc891efedae2291e578475f97715d1767",
                "ExpectedCommitmentTxHex": "02000000000101bef67e4e2fb9ddeeb3461973cd4c62abb35050b1add772995b820b584a488489000000000038b02b8004b80b000000000000220020c20b5d1f8584fd90443e7b7b720136174fa4b9333c261d04dbbd012635c0f419a00f0000000000002200208c48d15160397c9731df9bc3b236656efb6665fbfe92b4a6878e88a499f741c4c0c62d0000000000160014cc1b07838e387deacd0e5232e1e8b49f4c29e484b8976a00000000002200204adb4e2f00643db396dd120d4e7dc17625f5f2c11a40d857accc862d6b7dd80e0400473044022044d592025b610c0d678f65032e87035cdfe89d1598c522cc32524ae8172417c30220749fef9d5b2ae8cdd91ece442ba8809bc891efedae2291e578475f97715d17670147304402201a8c1b1f9671cd9e46c7323a104d7047cc48d3ee80d40d4512e0c72b8dc65666022066d7f9a2ce18c9eb22d2739ffcce05721c767f9b607622a31b6ea5793ddce40301475221023da092f6980e58d2c037173180e9a465476026ee50f96695963e8efe436f54eb21030e9f7b623d2ccc7c9bd44d66d5ce21ce504c0acf6385a132cec6d3c39fa711c152ae3e195220",
            },
            {
                "Name": "option_static_remotekey - commitment tx with four outputs untrimmed (maximum feerate)",
                "OptionStaticRemoteKey": true,
                "LocalBalance": 6988000000,
                "RemoteBalance": 3000000000,
                "FeePerKw": 3702,
                "UseTestHtlcs": true,
                "HtlcDescs": [
                    {
                        "RemoteSigHex": "304402206fa54c11f98c3bae1e93df43fc7affeb05b476bf8060c03e29c377c69bc08e8b0220672701cce50d5c379ff45a5d2cfe48ac44973adb066ac32608e21221d869bb89",
                        "LocalSigHex": "304402206e36c683ebf2cb16bcef3d5439cf8b53cd97280a365ed8acd7abb85a8ba5f21c02206e8621edfc2a5766cbc96eb67fd501127ff163eb6b85518a39f7d4974aef126f",
                        "ResolutionTxHex": "020000000001018db483bff65c70ee71d8282aeec5a880e2e2b39e45772bda5460403095c62e3f0000000000000000000122020000000000002200204adb4e2f00643db396dd120d4e7dc17625f5f2c11a40d857accc862d6b7dd80e050047304402206fa54c11f98c3bae1e93df43fc7affeb05b476bf8060c03e29c377c69bc08e8b0220672701cce50d5c379ff45a5d2cfe48ac44973adb066ac32608e21221d869bb890147304402206e36c683ebf2cb16bcef3d5439cf8b53cd97280a365ed8acd7abb85a8ba5f21c02206e8621edfc2a5766cbc96eb67fd501127ff163eb6b85518a39f7d4974aef126f01008576a91414011f7254d96b819c76986c277d115efce6f7b58763ac67210394854aa6eab5b2a8122cc726e9dded053a2184d88256816826d6231c068d4a5b7c820120876475527c21030d417a46946384f88d5f3337267c5e579765875dc4daca813e21734b140639e752ae67a9148a486ff2e31d6158bf39e2608864d63fefd09d5b88ac6868f7010000"
                    },
                    {
                        "RemoteSigHex": "3044022057649739b0eb74d541ead0dfdb3d4b2c15aa192720031044c3434c67812e5ca902201e5ede42d960ae551707f4a6b34b09393cf4dee2418507daa022e3550dbb5817",
                        "LocalSigHex": "304402207faad26678c8850e01b4a0696d60841f7305e1832b786110ee9075cb92ed14a30220516ef8ee5dfa80824ea28cbcec0dd95f8b847146257c16960db98507db15ffdc",
                        "ResolutionTxHex": "020000000001018db483bff65c70ee71d8282aeec5a880e2e2b39e45772bda5460403095c62e3f0100000000000000000176050000000000002200204adb4e2f00643db396dd120d4e7dc17625f5f2c11a40d857accc862d6b7dd80e0500473044022057649739b0eb74d541ead0dfdb3d4b2c15aa192720031044c3434c67812e5ca902201e5ede42d960ae551707f4a6b34b09393cf4dee2418507daa022e3550dbb58170147304402207faad26678c8850e01b4a0696d60841f7305e1832b786110ee9075cb92ed14a30220516ef8ee5dfa80824ea28cbcec0dd95f8b847146257c16960db98507db15ffdc012004040404040404040404040404040404040404040404040404040404040404048a76a91414011f7254d96b819c76986c277d115efce6f7b58763ac67210394854aa6eab5b2a8122cc726e9dded053a2184d88256816826d6231c068d4a5b7c8201208763a91418bc1a114ccf9c052d3d23e28d3b0a9d1227434288527c21030d417a46946384f88d5f3337267c5e579765875dc4daca813e21734b140639e752ae677502f801b175ac686800000000"
                    },
                ],
                "RemoteSigHex": "304502210092a587aeb777f869e7ff0d7898ea619ee26a3dacd1f3672b945eea600be431100220077ee9eae3528d15251f2a52b607b189820e57a6ccfac8d1af502b132ee40169",
                "LocalSigHex": "3045022100e5efb73c32d32da2d79702299b6317de6fb24a60476e3855926d78484dd1b3c802203557cb66a42c944ef06e00bcc4da35a5bcb2f185aab0f8e403e519e1d66aaf75",
                "ExpectedCommitmentTxHex": "02000000000101bef67e4e2fb9ddeeb3461973cd4c62abb35050b1add772995b820b584a488489000000000038b02b8004b80b000000000000220020c20b5d1f8584fd90443e7b7b720136174fa4b9333c261d04dbbd012635c0f419a00f0000000000002200208c48d15160397c9731df9bc3b236656efb6665fbfe92b4a6878e88a499f741c4c0c62d0000000000160014cc1b07838e387deacd0e5232e1e8b49f4c29e4846f916a00000000002200204adb4e2f00643db396dd120d4e7dc17625f5f2c11a40d857accc862d6b7dd80e0400483045022100e5efb73c32d32da2d79702299b6317de6fb24a60476e3855926d78484dd1b3c802203557cb66a42c944ef06e00bcc4da35a5bcb2f185aab0f8e403e519e1d66aaf750148304502210092a587aeb777f869e7ff0d7898ea619ee26a3dacd1f3672b945eea600be431100220077ee9eae3528d15251f2a52b607b189820e57a6ccfac8d1af502b132ee4016901475221023da092f6980e58d2c037173180e9a465476026ee50f96695963e8efe436f54eb21030e9f7b623d2ccc7c9bd44d66d5ce21ce504c0acf6385a132cec6d3c39fa711c152ae3e195220",
            },
            {
                "Name": "option_static_remotekey - commitment tx with three outputs untrimmed (minimum feerate)",
                "OptionStaticRemoteKey": true,
                "LocalBalance": 6988000000,
                "RemoteBalance": 3000000000,
                "FeePerKw": 3703,
                "UseTestHtlcs": true,
                "HtlcDescs": [
                    {
                        "RemoteSigHex": "3045022100c34c61735f93f2e324cc873c3b248111ccf8f6db15d5969583757010d4ad2b4602207867bb919b2ddd6387873e425345c9b7fd18d1d66aba41f3607bc2896ef3c30a",
                        "LocalSigHex": "3045022100988c143e2110067117d2321bdd4bd16ca1734c98b29290d129384af0962b634e02206c1b02478878c5f547018b833986578f90c3e9be669fe5788ad0072a55acbb05",
                        "ResolutionTxHex": "0200000000010120060e4a29579d429f0f27c17ee5f1ee282f20d706d6f90b63d35946d8f3029a0000000000000000000175050000000000002200204adb4e2f00643db396dd120d4e7dc17625f5f2c11a40d857accc862d6b7dd80e0500483045022100c34c61735f93f2e324cc873c3b248111ccf8f6db15d5969583757010d4ad2b4602207867bb919b2ddd6387873e425345c9b7fd18d1d66aba41f3607bc2896ef3c30a01483045022100988c143e2110067117d2321bdd4bd16ca1734c98b29290d129384af0962b634e02206c1b02478878c5f547018b833986578f90c3e9be669fe5788ad0072a55acbb05012004040404040404040404040404040404040404040404040404040404040404048a76a91414011f7254d96b819c76986c277d115efce6f7b58763ac67210394854aa6eab5b2a8122cc726e9dded053a2184d88256816826d6231c068d4a5b7c8201208763a91418bc1a114ccf9c052d3d23e28d3b0a9d1227434288527c21030d417a46946384f88d5f3337267c5e579765875dc4daca813e21734b140639e752ae677502f801b175ac686800000000"
                    },

                ],
                "RemoteSigHex": "3045022100b495d239772a237ff2cf354b1b11be152fd852704cb184e7356d13f2fb1e5e430220723db5cdb9cbd6ead7bfd3deb419cf41053a932418cbb22a67b581f40bc1f13e",
                "LocalSigHex": "304402201b736d1773a124c745586217a75bed5f66c05716fbe8c7db4fdb3c3069741cdd02205083f39c321c1bcadfc8d97e3c791a66273d936abac0c6a2fde2ed46019508e1",
                "ExpectedCommitmentTxHex": "02000000000101bef67e4e2fb9ddeeb3461973cd4c62abb35050b1add772995b820b584a488489000000000038b02b8003a00f0000000000002200208c48d15160397c9731df9bc3b236656efb6665fbfe92b4a6878e88a499f741c4c0c62d0000000000160014cc1b07838e387deacd0e5232e1e8b49f4c29e484eb936a00000000002200204adb4e2f00643db396dd120d4e7dc17625f5f2c11a40d857accc862d6b7dd80e040047304402201b736d1773a124c745586217a75bed5f66c05716fbe8c7db4fdb3c3069741cdd02205083f39c321c1bcadfc8d97e3c791a66273d936abac0c6a2fde2ed46019508e101483045022100b495d239772a237ff2cf354b1b11be152fd852704cb184e7356d13f2fb1e5e430220723db5cdb9cbd6ead7bfd3deb419cf41053a932418cbb22a67b581f40bc1f13e01475221023da092f6980e58d2c037173180e9a465476026ee50f96695963e8efe436f54eb21030e9f7b623d2ccc7c9bd44d66d5ce21ce504c0acf6385a132cec6d3c39fa711c152ae3e195220",
            },
            {
                "Name": "option_static_remotekey - commitment tx with three outputs untrimmed (maximum feerate)",
                "OptionStaticRemoteKey": true,
                "LocalBalance": 6988000000,
                "RemoteBalance": 3000000000,
                "FeePerKw": 4914,
                "UseTestHtlcs": true,
                "HtlcDescs": [
                    {
                        "RemoteSigHex": "3045022100f43591c156038ba217756006bb3c55f7d113a325cdd7d9303c82115372858d68022016355b5aadf222bc8d12e426c75f4a03423917b2443a103eb2a498a3a2234374",
                        "LocalSigHex": "30440220585dee80fafa264beac535c3c0bb5838ac348b156fdc982f86adc08dfc9bfd250220130abb82f9f295cc9ef423dcfef772fde2acd85d9df48cc538981d26a10a9c10",
                        "ResolutionTxHex": "02000000000101a9172908eace869cc35128c31fc2ab502f72e4dff31aab23e0244c4b04b11ab00000000000000000000122020000000000002200204adb4e2f00643db396dd120d4e7dc17625f5f2c11a40d857accc862d6b7dd80e0500483045022100f43591c156038ba217756006bb3c55f7d113a325cdd7d9303c82115372858d68022016355b5aadf222bc8d12e426c75f4a03423917b2443a103eb2a498a3a2234374014730440220585dee80fafa264beac535c3c0bb5838ac348b156fdc982f86adc08dfc9bfd250220130abb82f9f295cc9ef423dcfef772fde2acd85d9df48cc538981d26a10a9c10012004040404040404040404040404040404040404040404040404040404040404048a76a91414011f7254d96b819c76986c277d115efce6f7b58763ac67210394854aa6eab5b2a8122cc726e9dded053a2184d88256816826d6231c068d4a5b7c8201208763a91418bc1a114ccf9c052d3d23e28d3b0a9d1227434288527c21030d417a46946384f88d5f3337267c5e579765875dc4daca813e21734b140639e752ae677502f801b175ac686800000000"
                    },

                ],
                "RemoteSigHex": "3045022100b4b16d5f8cc9fc4c1aff48831e832a0d8990e133978a66e302c133550954a44d022073573ce127e2200d316f6b612803a5c0c97b8d20e1e44dbe2ac0dd2fb8c95244",
                "LocalSigHex": "3045022100d72638bc6308b88bb6d45861aae83e5b9ff6e10986546e13bce769c70036e2620220320be7c6d66d22f30b9fcd52af66531505b1310ca3b848c19285b38d8a1a8c19",
                "ExpectedCommitmentTxHex": "02000000000101bef67e4e2fb9ddeeb3461973cd4c62abb35050b1add772995b820b584a488489000000000038b02b8003a00f0000000000002200208c48d15160397c9731df9bc3b236656efb6665fbfe92b4a6878e88a499f741c4c0c62d0000000000160014cc1b07838e387deacd0e5232e1e8b49f4c29e484ae8f6a00000000002200204adb4e2f00643db396dd120d4e7dc17625f5f2c11a40d857accc862d6b7dd80e0400483045022100d72638bc6308b88bb6d45861aae83e5b9ff6e10986546e13bce769c70036e2620220320be7c6d66d22f30b9fcd52af66531505b1310ca3b848c19285b38d8a1a8c1901483045022100b4b16d5f8cc9fc4c1aff48831e832a0d8990e133978a66e302c133550954a44d022073573ce127e2200d316f6b612803a5c0c97b8d20e1e44dbe2ac0dd2fb8c9524401475221023da092f6980e58d2c037173180e9a465476026ee50f96695963e8efe436f54eb21030e9f7b623d2ccc7c9bd44d66d5ce21ce504c0acf6385a132cec6d3c39fa711c152ae3e195220",
            },
            {
                "Name": "option_static_remotekey - commitment tx with two outputs untrimmed (minimum feerate)",
                "OptionStaticRemoteKey": true,
                "LocalBalance": 6988000000,
                "RemoteBalance": 3000000000,
                "FeePerKw": 4915,
                "UseTestHtlcs": true,
                "HtlcDescs": [
                ],
                "RemoteSigHex": "304402203a286936e74870ca1459c700c71202af0381910a6bfab687ef494ef1bc3e02c902202506c362d0e3bee15e802aa729bf378e051644648253513f1c085b264cc2a720",
                "LocalSigHex": "30450221008a953551f4d67cb4df3037207fc082ddaf6be84d417b0bd14c80aab66f1b01a402207508796dc75034b2dee876fe01dc05a08b019f3e5d689ac8842ade2f1befccf5",
                "ExpectedCommitmentTxHex": "02000000000101bef67e4e2fb9ddeeb3461973cd4c62abb35050b1add772995b820b584a488489000000000038b02b8002c0c62d0000000000160014cc1b07838e387deacd0e5232e1e8b49f4c29e484fa926a00000000002200204adb4e2f00643db396dd120d4e7dc17625f5f2c11a40d857accc862d6b7dd80e04004830450221008a953551f4d67cb4df3037207fc082ddaf6be84d417b0bd14c80aab66f1b01a402207508796dc75034b2dee876fe01dc05a08b019f3e5d689ac8842ade2f1befccf50147304402203a286936e74870ca1459c700c71202af0381910a6bfab687ef494ef1bc3e02c902202506c362d0e3bee15e802aa729bf378e051644648253513f1c085b264cc2a72001475221023da092f6980e58d2c037173180e9a465476026ee50f96695963e8efe436f54eb21030e9f7b623d2ccc7c9bd44d66d5ce21ce504c0acf6385a132cec6d3c39fa711c152ae3e195220",
            },
            {
                "Name": "option_static_remotekey - commitment tx with two outputs untrimmed (maximum feerate)",
                "OptionStaticRemoteKey": true,
                "LocalBalance": 6988000000,
                "RemoteBalance": 3000000000,
                "FeePerKw": 9651180,
                "UseTestHtlcs": true,
                "HtlcDescs": [
                ],
                "RemoteSigHex": "304402200a8544eba1d216f5c5e530597665fa9bec56943c0f66d98fc3d028df52d84f7002201e45fa5c6bc3a506cc2553e7d1c0043a9811313fc39c954692c0d47cfce2bbd3",
                "LocalSigHex": "3045022100e11b638c05c650c2f63a421d36ef8756c5ce82f2184278643520311cdf50aa200220259565fb9c8e4a87ccaf17f27a3b9ca4f20625754a0920d9c6c239d8156a11de",
                "ExpectedCommitmentTxHex": "02000000000101bef67e4e2fb9ddeeb3461973cd4c62abb35050b1add772995b820b584a488489000000000038b02b800222020000000000002200204adb4e2f00643db396dd120d4e7dc17625f5f2c11a40d857accc862d6b7dd80ec0c62d0000000000160014cc1b07838e387deacd0e5232e1e8b49f4c29e4840400483045022100e11b638c05c650c2f63a421d36ef8756c5ce82f2184278643520311cdf50aa200220259565fb9c8e4a87ccaf17f27a3b9ca4f20625754a0920d9c6c239d8156a11de0147304402200a8544eba1d216f5c5e530597665fa9bec56943c0f66d98fc3d028df52d84f7002201e45fa5c6bc3a506cc2553e7d1c0043a9811313fc39c954692c0d47cfce2bbd301475221023da092f6980e58d2c037173180e9a465476026ee50f96695963e8efe436f54eb21030e9f7b623d2ccc7c9bd44d66d5ce21ce504c0acf6385a132cec6d3c39fa711c152ae3e195220",
            },
            {
                "Name": "option_static_remotekey - commitment tx with one output untrimmed (minimum feerate)",
                "OptionStaticRemoteKey": true,
                "LocalBalance": 6988000000,
                "RemoteBalance": 3000000000,
                "FeePerKw": 9651181,
                "UseTestHtlcs": true,
                "HtlcDescs": [
                ],
                "RemoteSigHex": "304402202ade0142008309eb376736575ad58d03e5b115499709c6db0b46e36ff394b492022037b63d78d66404d6504d4c4ac13be346f3d1802928a6d3ad95a6a944227161a2",
                "LocalSigHex": "304402207e8d51e0c570a5868a78414f4e0cbfaed1106b171b9581542c30718ee4eb95ba02203af84194c97adf98898c9afe2f2ed4a7f8dba05a2dfab28ac9d9c604aa49a379",
                "ExpectedCommitmentTxHex": "02000000000101bef67e4e2fb9ddeeb3461973cd4c62abb35050b1add772995b820b584a488489000000000038b02b8001c0c62d0000000000160014cc1b07838e387deacd0e5232e1e8b49f4c29e484040047304402207e8d51e0c570a5868a78414f4e0cbfaed1106b171b9581542c30718ee4eb95ba02203af84194c97adf98898c9afe2f2ed4a7f8dba05a2dfab28ac9d9c604aa49a3790147304402202ade0142008309eb376736575ad58d03e5b115499709c6db0b46e36ff394b492022037b63d78d66404d6504d4c4ac13be346f3d1802928a6d3ad95a6a944227161a201475221023da092f6980e58d2c037173180e9a465476026ee50f96695963e8efe436f54eb21030e9f7b623d2ccc7c9bd44d66d5ce21ce504c0acf6385a132cec6d3c39fa711c152ae3e195220",
            },
            {
                "Name": "option_static_remotekey - commitment tx with fee greater than funder amount",
                "OptionStaticRemoteKey": true,
                "LocalBalance": 6988000000,
                "RemoteBalance": 3000000000,
                "FeePerKw": 9651936,
                "UseTestHtlcs": true,
                "HtlcDescs": [
                ],
                "RemoteSigHex": "304402202ade0142008309eb376736575ad58d03e5b115499709c6db0b46e36ff394b492022037b63d78d66404d6504d4c4ac13be346f3d1802928a6d3ad95a6a944227161a2",
                "LocalSigHex": "304402207e8d51e0c570a5868a78414f4e0cbfaed1106b171b9581542c30718ee4eb95ba02203af84194c97adf98898c9afe2f2ed4a7f8dba05a2dfab28ac9d9c604aa49a379",
                "ExpectedCommitmentTxHex": "02000000000101bef67e4e2fb9ddeeb3461973cd4c62abb35050b1add772995b820b584a488489000000000038b02b8001c0c62d0000000000160014cc1b07838e387deacd0e5232e1e8b49f4c29e484040047304402207e8d51e0c570a5868a78414f4e0cbfaed1106b171b9581542c30718ee4eb95ba02203af84194c97adf98898c9afe2f2ed4a7f8dba05a2dfab28ac9d9c604aa49a3790147304402202ade0142008309eb376736575ad58d03e5b115499709c6db0b46e36ff394b492022037b63d78d66404d6504d4c4ac13be346f3d1802928a6d3ad95a6a944227161a201475221023da092f6980e58d2c037173180e9a465476026ee50f96695963e8efe436f54eb21030e9f7b623d2ccc7c9bd44d66d5ce21ce504c0acf6385a132cec6d3c39fa711c152ae3e195220",
            },
            {
                "Name": "option_static_remotekey - commitment tx with 3 htlc outputs, 2 offered having the same amount and preimage",
                "OptionStaticRemoteKey": true,
                "LocalBalance": 6988000000,
                "RemoteBalance": 3000000000,
                "FeePerKw": 253,
                "UseTestHtlcs": true,
                "TestHtlcs": [
                    channel.htlcs[1],
                    new Htlc(
                        5n,
                        HtlcDirection.Offered,
                        Value.fromMilliSats(5000000),
                        505,
                        sha256(b("0505050505050505050505050505050505050505050505050505050505050505")),
                        b("0505050505050505050505050505050505050505050505050505050505050505"),
                    ),
                    new Htlc(
                        6n,
                        HtlcDirection.Offered,
                        Value.fromMilliSats(5000000),
                        506,
                        sha256(b("0505050505050505050505050505050505050505050505050505050505050505")),
                        b("0505050505050505050505050505050505050505050505050505050505050505"),
                    ),
                ],
                "HtlcDescs": [
                    {
                        "RemoteSigHex": "304502210081cbb94121761d34c189cd4e6a281feea6f585060ad0ba2632e8d6b3c6bb8a6c02201007981bbd16539d63df2805b5568f1f5688cd2a885d04706f50db9b77ba13c6",
                        "LocalSigHex": "304502210090ed76aeb21b53236a598968abc66e2024691d07b62f53ddbeca8f93144af9c602205f873af5a0c10e62690e9aba09740550f194a9dc455ba4c1c23f6cde7704674c",
                        "ResolutionTxHex": "0200000000010189a326e23addc28323dbadcb4e71c2c17088b6e8fa184103e552f44075dddc34000000000000000000011f070000000000002200204adb4e2f00643db396dd120d4e7dc17625f5f2c11a40d857accc862d6b7dd80e050048304502210081cbb94121761d34c189cd4e6a281feea6f585060ad0ba2632e8d6b3c6bb8a6c02201007981bbd16539d63df2805b5568f1f5688cd2a885d04706f50db9b77ba13c60148304502210090ed76aeb21b53236a598968abc66e2024691d07b62f53ddbeca8f93144af9c602205f873af5a0c10e62690e9aba09740550f194a9dc455ba4c1c23f6cde7704674c012001010101010101010101010101010101010101010101010101010101010101018a76a91414011f7254d96b819c76986c277d115efce6f7b58763ac67210394854aa6eab5b2a8122cc726e9dded053a2184d88256816826d6231c068d4a5b7c8201208763a9144b6b2e5444c2639cc0fb7bcea5afba3f3cdce23988527c21030d417a46946384f88d5f3337267c5e579765875dc4daca813e21734b140639e752ae677502f501b175ac686800000000"
                    },
                    {
                        "RemoteSigHex": "304402201d0f09d2bf7bc245a4f17980e1e9164290df16c70c6a2ff1592f5030d6108581022061e744a7dc151b36bf0aff7a4f1812ba90b8b03633bb979a270d19858fd960c5",
                        "LocalSigHex": "30450221009aef000d2e843a4202c1b1a2bf554abc9a7902bf49b2cb0759bc507456b7ebad02204e7c3d193ede2fd2b4cd6b39f51a920e581e35575e357e44d7b699c40ce61d39",
                        "ResolutionTxHex": "0200000000010189a326e23addc28323dbadcb4e71c2c17088b6e8fa184103e552f44075dddc3401000000000000000001e1120000000000002200204adb4e2f00643db396dd120d4e7dc17625f5f2c11a40d857accc862d6b7dd80e050047304402201d0f09d2bf7bc245a4f17980e1e9164290df16c70c6a2ff1592f5030d6108581022061e744a7dc151b36bf0aff7a4f1812ba90b8b03633bb979a270d19858fd960c5014830450221009aef000d2e843a4202c1b1a2bf554abc9a7902bf49b2cb0759bc507456b7ebad02204e7c3d193ede2fd2b4cd6b39f51a920e581e35575e357e44d7b699c40ce61d3901008576a91414011f7254d96b819c76986c277d115efce6f7b58763ac67210394854aa6eab5b2a8122cc726e9dded053a2184d88256816826d6231c068d4a5b7c820120876475527c21030d417a46946384f88d5f3337267c5e579765875dc4daca813e21734b140639e752ae67a9142002cc93ebefbb1b73f0af055dcc27a0b504ad7688ac6868f9010000"
                    },
                    {
                        "RemoteSigHex": "30440220010bf035d5823596e50dce2076a4d9f942d8d28031c9c428b901a02b6b8140de02203250e8e4a08bc5b4ecdca4d0eedf98223e02e3ac1c0206b3a7ffdb374aa21e5f",
                        "LocalSigHex": "30440220073de0067b88e425b3018b30366bfeda0ccb703118ccd3d02ead08c0f53511d002203fac50ac0e4cf8a3af0b4b1b12e801650591f748f8ddf1e089c160f10b69e511",
                        "ResolutionTxHex": "0200000000010189a326e23addc28323dbadcb4e71c2c17088b6e8fa184103e552f44075dddc3402000000000000000001e1120000000000002200204adb4e2f00643db396dd120d4e7dc17625f5f2c11a40d857accc862d6b7dd80e05004730440220010bf035d5823596e50dce2076a4d9f942d8d28031c9c428b901a02b6b8140de02203250e8e4a08bc5b4ecdca4d0eedf98223e02e3ac1c0206b3a7ffdb374aa21e5f014730440220073de0067b88e425b3018b30366bfeda0ccb703118ccd3d02ead08c0f53511d002203fac50ac0e4cf8a3af0b4b1b12e801650591f748f8ddf1e089c160f10b69e51101008576a91414011f7254d96b819c76986c277d115efce6f7b58763ac67210394854aa6eab5b2a8122cc726e9dded053a2184d88256816826d6231c068d4a5b7c820120876475527c21030d417a46946384f88d5f3337267c5e579765875dc4daca813e21734b140639e752ae67a9142002cc93ebefbb1b73f0af055dcc27a0b504ad7688ac6868fa010000"
                    },
                ],
                "RemoteSigHex": "30440220048705bec5288d28b3f29344b8d124853b1af423a568664d2c6f02c8ea886525022060f998a461052a2476b912db426ea2a06700953a241135c7957f2e79bc222df9",
                "LocalSigHex": "3045022100c4f1d60b6fca9febc8b39de1a31e84c5f7c4b41c97239ef05f4350aa484c6b5e02200c5134ac8b20eb7a29d0dd4a501f6aa8fefb8489171f4cb408bd2a32324ab03f",
                "ExpectedCommitmentTxHex": "02000000000101bef67e4e2fb9ddeeb3461973cd4c62abb35050b1add772995b820b584a488489000000000038b02b8005d007000000000000220020748eba944fedc8827f6b06bc44678f93c0f9e6078b35c6331ed31e75f8ce0c2d8813000000000000220020305c12e1a0bc21e283c131cea1c66d68857d28b7b2fce0a6fbc40c164852121b8813000000000000220020305c12e1a0bc21e283c131cea1c66d68857d28b7b2fce0a6fbc40c164852121bc0c62d0000000000160014cc1b07838e387deacd0e5232e1e8b49f4c29e484a79f6a00000000002200204adb4e2f00643db396dd120d4e7dc17625f5f2c11a40d857accc862d6b7dd80e0400483045022100c4f1d60b6fca9febc8b39de1a31e84c5f7c4b41c97239ef05f4350aa484c6b5e02200c5134ac8b20eb7a29d0dd4a501f6aa8fefb8489171f4cb408bd2a32324ab03f014730440220048705bec5288d28b3f29344b8d124853b1af423a568664d2c6f02c8ea886525022060f998a461052a2476b912db426ea2a06700953a241135c7957f2e79bc222df901475221023da092f6980e58d2c037173180e9a465476026ee50f96695963e8efe436f54eb21030e9f7b623d2ccc7c9bd44d66d5ce21ce504c0acf6385a132cec6d3c39fa711c152ae3e195220",
            },
            // {
            //     "Name": "option_static_remotekey - ",
            //     "OptionStaticRemoteKey": true,
            //     "LocalBalance": 6988000000,
            //     "RemoteBalance": 3000000000,
            //     "FeePerKw": 0,
            //     "UseTestHtlcs": true,
            //     "HtlcDescs": [
            //         {
            //             "RemoteSigHex": "",
            //             "LocalSigHex": "",
            //             "ResolutionTxHex": ""
            //         },

            //     ],
            //     "RemoteSigHex": "",
            //     "LocalSigHex": "",
            //     "ExpectedCommitmentTxHex": "",
            // },
        ]; // prettier-ignore

        for (const vector of vectors) {
            it("holder: " + vector.Name, () => {
                const isFunderHolder = true;
                const localMsat = Value.fromMilliSats(vector.LocalBalance);
                const remoteMsat = Value.fromMilliSats(vector.RemoteBalance);
                const feePerKw = BigInt(vector.FeePerKw);
                const dustLimit = channel.localDustLimitSats;

                const commitmentNumber = channel.commitmentNumber;
                const openPaymentBasePoint = channel.localPaymentBasePoint;
                const acceptPaymentBasePoint = channel.remotePaymentBasePoint;
                const fundingOutPoint = channel.fundingOutPoint;
                const holderDelay = channel.localDelay;
                const revocationPubKey = channel.revocationPubKey;
                const delayedPubKey = channel.localDelayedPubKey;
                const remotePubKey = vector.OptionStaticRemoteKey
                    ? channel.remotePaymentBasePoint
                    : channel.remotePubKey;
                const localHtlcPubKey = channel.localPubKey;
                const remoteHtlcPubKey = channel.remotePubKey;
                const reverseHtlcs = false;
                const testHtlcs = vector.UseTestHtlcs ? vector.TestHtlcs ?? channel.htlcs : [];

                const [localTx, htlcs] = TxFactory.createCommitment(
                    isFunderHolder,
                    commitmentNumber,
                    openPaymentBasePoint,
                    acceptPaymentBasePoint,
                    fundingOutPoint,
                    dustLimit,
                    feePerKw,
                    holderDelay,
                    localMsat,
                    remoteMsat,
                    revocationPubKey,
                    delayedPubKey,
                    remotePubKey,
                    reverseHtlcs,
                    localHtlcPubKey,
                    remoteHtlcPubKey,
                    testHtlcs,
                );

                const fundingWitnessScript = ScriptFactory.fundingScript(
                    channel.openFundingPubKey,
                    channel.acceptFundingPubKey,
                );

                const localSig = localTx.signSegWitv0(
                    0,
                    fundingWitnessScript,
                    channel.localFundingPrivKey,
                    channel.fundingSats,
                );
                const remoteSig = Buffer.from(vector.RemoteSigHex + "01", "hex");

                localTx.inputs[0].witness.push(new Witness(Buffer.alloc(0)));
                if (channel.openFundingPubKey.compare(channel.acceptFundingPubKey) < 0) {
                    localTx.inputs[0].witness.push(new Witness(localSig));
                    localTx.inputs[0].witness.push(new Witness(remoteSig));
                } else {
                    localTx.inputs[0].witness.push(new Witness(remoteSig));
                    localTx.inputs[0].witness.push(new Witness(localSig));
                }
                localTx.inputs[0].witness.push(new Witness(fundingWitnessScript.serializeCmds()));

                expect(localTx.toHex(true)).to.equal(
                    Tx.fromHex(vector.ExpectedCommitmentTxHex).toHex(true),
                );

                const commitmentTxId = localTx.toTx().txId;

                // Test all of the HTLCs
                for (let i = 0; i < htlcs.length; i++) {
                    const htlc = htlcs[i];
                    const outputIndex = i;

                    if (!vector.HtlcDescs[i] || !vector.HtlcDescs[i].LocalSigHex) continue;

                    let htlctx: TxBuilder;
                    let witnessScript: Script;
                    let preimage: Buffer;

                    // Offered HTLC
                    if (htlc.direction === HtlcDirection.Offered) {
                        htlctx = TxFactory.createHtlcTimeout(
                            commitmentTxId,
                            outputIndex,
                            channel.localDelay,
                            channel.revocationPubKey,
                            channel.localDelayedPubKey,
                            feePerKw,
                            htlc,
                        );

                        witnessScript = ScriptFactory.offeredHtlcScript(
                            htlc.paymentHash,
                            channel.revocationPubKey,
                            channel.localPubKey,
                            channel.remotePubKey,
                        );

                        preimage = Buffer.alloc(0);
                    }
                    // Received HTLC
                    else {
                        htlctx = TxFactory.createHtlcSuccess(
                            commitmentTxId,
                            outputIndex,
                            channel.localDelay,
                            channel.revocationPubKey,
                            channel.localDelayedPubKey,
                            feePerKw,
                            htlc,
                        );

                        witnessScript = ScriptFactory.receivedHtlcScript(
                            htlc.paymentHash,
                            htlc.cltvExpiry,
                            channel.revocationPubKey,
                            channel.localPubKey,
                            channel.remotePubKey,
                        );

                        preimage = htlc.paymentPreimage;
                    }

                    // sign with local
                    const localSig = htlctx.signSegWitv0(
                        0,
                        witnessScript,
                        channel.localPrivKey,
                        htlc.value,
                    );

                    htlctx.inputs[0].witness.push(new Witness(Buffer.alloc(0)));
                    htlctx.inputs[0].witness.push(new Witness(b(vector.HtlcDescs[i].RemoteSigHex+"01"))); // prettier-ignore
                    htlctx.inputs[0].witness.push(new Witness(localSig));
                    htlctx.inputs[0].witness.push(new Witness(preimage));
                    htlctx.inputs[0].witness.push(new Witness(witnessScript.serializeCmds()));

                    expect(htlctx.toHex(true)).to.equal(
                        Tx.fromHex(vector.HtlcDescs[i].ResolutionTxHex as string).toHex(true),
                    );
                }
            });
        }

        for (const vector of vectors) {
            it("counterparty: " + vector.Name, () => {
                const isFunderHolder = true;
                const localMsat = Value.fromMilliSats(vector.LocalBalance);
                const remoteMsat = Value.fromMilliSats(vector.RemoteBalance);
                const feePerKw = BigInt(vector.FeePerKw);
                const dustLimit = channel.localDustLimitSats;

                const commitmentNumber = channel.commitmentNumber;
                const openPaymentBasePoint = channel.localPaymentBasePoint;
                const acceptPaymentBasePoint = channel.remotePaymentBasePoint;
                const fundingOutPoint = channel.fundingOutPoint;
                const holderDelay = channel.localDelay;
                const revocationPubKey = channel.revocationPubKey;
                const delayedPubKey = channel.localDelayedPubKey;
                const remotePubKey = vector.OptionStaticRemoteKey
                    ? channel.remotePaymentBasePoint
                    : channel.remotePubKey;
                const localHtlcPubKey = channel.localPubKey;
                const remoteHtlcPubKey = channel.remotePubKey;
                const reverseHtlcs = true;
                const testHtlcs = vector.UseTestHtlcs
                    ? (vector.TestHtlcs ?? channel.htlcs).map(
                          h =>
                              new Htlc(
                                  h.htlcId,
                                  h.direction === HtlcDirection.Offered
                                      ? HtlcDirection.Accepted
                                      : HtlcDirection.Offered,
                                  h.value,
                                  h.cltvExpiry,
                                  h.paymentHash,
                              ),
                      )
                    : [];

                const [localTx] = TxFactory.createCommitment(
                    isFunderHolder,
                    commitmentNumber,
                    openPaymentBasePoint,
                    acceptPaymentBasePoint,
                    fundingOutPoint,
                    dustLimit,
                    feePerKw,
                    holderDelay,
                    localMsat,
                    remoteMsat,
                    revocationPubKey,
                    delayedPubKey,
                    remotePubKey,
                    reverseHtlcs,
                    localHtlcPubKey,
                    remoteHtlcPubKey,
                    testHtlcs,
                );

                const fundingWitnessScript = ScriptFactory.fundingScript(
                    channel.openFundingPubKey,
                    channel.acceptFundingPubKey,
                );

                const remoteSig = Buffer.from(vector.LocalSigHex + "01", "hex");
                const localSig = Buffer.from(vector.RemoteSigHex + "01", "hex");

                localTx.inputs[0].witness.push(new Witness(Buffer.alloc(0)));
                if (channel.openFundingPubKey.compare(channel.acceptFundingPubKey) < 0) {
                    localTx.inputs[0].witness.push(new Witness(remoteSig));
                    localTx.inputs[0].witness.push(new Witness(localSig));
                } else {
                    localTx.inputs[0].witness.push(new Witness(localSig));
                    localTx.inputs[0].witness.push(new Witness(remoteSig));
                }
                localTx.inputs[0].witness.push(new Witness(fundingWitnessScript.serializeCmds()));

                expect(localTx.toHex(true)).to.equal(
                    Tx.fromHex(vector.ExpectedCommitmentTxHex).toHex(true),
                );
            });
        }
    });
});
