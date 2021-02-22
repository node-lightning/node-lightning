import * as crypto from "@node-lightning/crypto";
import {
    Script,
    Value,
    TxBuilder,
    bip69InputSorter,
    bip69OutputSorter,
    LockTime,
    OutPoint,
    Witness,
    OpCode,
} from "@node-lightning/bitcoin";
import { expect } from "chai";
import { TxFactory } from "../../lib/lightning/TxFactory";
import { sha256 } from "@node-lightning/crypto";
import { ScriptFactory } from "../../lib/lightning/ScriptFactory";
import { Htlc } from "../../lib/lightning/Htlc";
import { HtlcDirection } from "../../lib/lightning/HtlcDirection";

describe("TxFactory", () => {
    const b = (hex: string) => Buffer.from(hex, "hex");

    describe("#.addFundingOutput", () => {
        it("test vector", () => {
            const privkey = Buffer.from("6bd078650fcee8444e4e09825227b801a1ca928debb750eb36e6d56124bb20e8","hex"); // prettier-ignore
            const pubkey = crypto.getPublicKey(privkey);

            const builder = new TxBuilder(bip69InputSorter, bip69OutputSorter);
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
            builder.locktime = LockTime.zero();

            builder.inputs[0].scriptSig = Script.p2pkhUnlock(
                builder.sign(0, Script.p2pkhLock(pubkey), privkey),
                crypto.getPublicKey(privkey, true),
            );

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

    describe("#commitmentTx", () => {
        describe("BOLT3 Test Vectors", () => {
            const fixtures = [
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
                    "HtlcDescs": [],
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
                    "HtlcDescs": [],
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
                    "HtlcDescs": [],
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
                    "HtlcDescs": [],
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
                    "HtlcDescs": [],
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
                    "HtlcDescs": [],
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
                    "HtlcDescs": [],
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
                    "HtlcDescs": [],
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
                    "HtlcDescs": [],
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
                    "HtlcDescs": [],
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
                    "HtlcDescs": [],
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
                    "HtlcDescs": [],
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
                    "HtlcDescs": [],
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
                    "HtlcDescs": [],
                    "RemoteSigHex": "3044022064901950be922e62cbe3f2ab93de2b99f37cff9fc473e73e394b27f88ef0731d02206d1dfa227527b4df44a07599289e207d6fd9cca60c0365682dcd3deaf739567e",
                    "LocalSigHex": "3044022031a82b51bd014915fe68928d1abf4b9885353fb896cac10c3fdd88d7f9c7f2e00220716bda819641d2c63e65d3549b6120112e1aeaf1742eed94a471488e79e206b1",
                    "ExpectedCommitmentTxHex": "02000000000101bef67e4e2fb9ddeeb3461973cd4c62abb35050b1add772995b820b584a488489000000000038b02b8001c0c62d0000000000160014ccf1af2f2aabee14bb40fa3851ab2301de8431100400473044022031a82b51bd014915fe68928d1abf4b9885353fb896cac10c3fdd88d7f9c7f2e00220716bda819641d2c63e65d3549b6120112e1aeaf1742eed94a471488e79e206b101473044022064901950be922e62cbe3f2ab93de2b99f37cff9fc473e73e394b27f88ef0731d02206d1dfa227527b4df44a07599289e207d6fd9cca60c0365682dcd3deaf739567e01475221023da092f6980e58d2c037173180e9a465476026ee50f96695963e8efe436f54eb21030e9f7b623d2ccc7c9bd44d66d5ce21ce504c0acf6385a132cec6d3c39fa711c152ae3e195220",
                },


            ]; // prettier-ignore

            for (const fixture of fixtures) {
                it(fixture.Name + ", owner perspective", () => {
                    const localDelay = 144;
                    const localFundingPrivKey = b("30ff4956bbdd3222d44cc5e8a1261dab1e07957bdac5ae88fe3261ef321f3749"); // prettier-ignore
                    const localFundingPubKey = b("023da092f6980e58d2c037173180e9a465476026ee50f96695963e8efe436f54eb"); // prettier-ignore
                    const remoteFundingPubKey = b("030e9f7b623d2ccc7c9bd44d66d5ce21ce504c0acf6385a132cec6d3c39fa711c1"); // prettier-ignore
                    const localPubKey = b("030d417a46946384f88d5f3337267c5e579765875dc4daca813e21734b140639e7"); // prettier-ignore
                    const remotePubKey = b("0394854aa6eab5b2a8122cc726e9dded053a2184d88256816826d6231c068d4a5b"); // prettier-ignore
                    const localDelayedPubKey = b("03fd5960528dc152014952efdb702a88f71e3c1653b2314431701ec77e57fde83c"); // prettier-ignore
                    const revocationPubKey = b("0212a140cd0c6539d07cd08dfe09984dec3251ea808b892efeac3ede9402bf2b19"); // prettier-ignore
                    const localPaymentBasePoint = b("034f355bdcb7cc0af728ef3cceb9615d90684bb5b2ca5f859ab0f0b704075871aa"); // prettier-ignore
                    const remotePaymentBasePoint = b("032c0b7cf95324a07d05398b240174dc0c2be444d96b159aa6c7f7b1e668680991"); // prettier-ignore

                    const commitmentNumber = 42;
                    const fundingOutPoint = OutPoint.fromString("8984484a580b825b9972d7adb15050b3ab624ccd731946b3eeddb92f4e7ef6be:0"); // prettier-ignore
                    const fundingSats = Value.fromSats(10000000);
                    const dustLimitSats = Value.fromSats(546);

                    const feePerKw = BigInt(fixture.FeePerKw);
                    const localMsat = Value.fromMilliSats(fixture.LocalBalance);
                    const remoteMsat = Value.fromMilliSats(fixture.RemoteBalance);

                    const htlcs = [
                        new Htlc(
                            BigInt(0),
                            HtlcDirection.Accepted,
                            Value.fromMilliSats(1000000),
                            500,
                            Buffer.from(
                                "0000000000000000000000000000000000000000000000000000000000000000",
                                "hex",
                            ),
                        ),
                        new Htlc(
                            BigInt(1),
                            HtlcDirection.Accepted,
                            Value.fromMilliSats(2000000),
                            501,
                            Buffer.from(
                                "0101010101010101010101010101010101010101010101010101010101010101",
                                "hex",
                            ),
                        ),
                        new Htlc(
                            BigInt(0),
                            HtlcDirection.Offered,
                            Value.fromMilliSats(2000000),
                            502,
                            Buffer.from(
                                "0202020202020202020202020202020202020202020202020202020202020202",
                                "hex",
                            ),
                        ),
                        new Htlc(
                            BigInt(1),
                            HtlcDirection.Offered,
                            Value.fromMilliSats(3000000),
                            503,
                            Buffer.from(
                                "0303030303030303030303030303030303030303030303030303030303030303",
                                "hex",
                            ),
                        ),
                        new Htlc(
                            BigInt(2),
                            HtlcDirection.Accepted,
                            Value.fromMilliSats(4000000),
                            504,
                            Buffer.from(
                                "0404040404040404040404040404040404040404040404040404040404040404",
                                "hex",
                            ),
                        ),
                    ];

                    const localTx = TxFactory.createCommitment(
                        true,
                        commitmentNumber,
                        localPaymentBasePoint,
                        remotePaymentBasePoint,
                        fundingOutPoint,
                        dustLimitSats,
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
                        fixture.UseTestHtlcs ? htlcs : [],
                    );

                    const fundingWitnessScript = ScriptFactory.fundingScript(
                        localFundingPubKey,
                        remoteFundingPubKey,
                    );

                    const localSig = localTx.signSegWitv0(
                        0,
                        fundingWitnessScript,
                        localFundingPrivKey,
                        fundingSats,
                    );
                    expect(localSig.toString("hex")).to.equal(fixture.LocalSigHex + "01");
                    const remoteSig = Buffer.from(fixture.RemoteSigHex + "01", "hex");

                    localTx.inputs[0].witness.push(new Witness(Buffer.alloc(0)));
                    if (localFundingPubKey.compare(remoteFundingPubKey) < 0) {
                        localTx.inputs[0].witness.push(new Witness(localSig));
                        localTx.inputs[0].witness.push(new Witness(remoteSig));
                    } else {
                        localTx.inputs[0].witness.push(new Witness(remoteSig));
                        localTx.inputs[0].witness.push(new Witness(localSig));
                    }
                    localTx.inputs[0].witness.push(
                        new Witness(fundingWitnessScript.serializeCmds()),
                    );

                    expect(localTx.serialize().toString("hex")).to.equal(
                        fixture.ExpectedCommitmentTxHex,
                    );
                });
            }

            for (const fixture of fixtures) {
                it(fixture.Name + ", counterparty perspective", () => {
                    const remoteDelay = 144;
                    const openFundingPubKey = b("023da092f6980e58d2c037173180e9a465476026ee50f96695963e8efe436f54eb"); // prettier-ignore
                    const acceptFundingPubKey = b("030e9f7b623d2ccc7c9bd44d66d5ce21ce504c0acf6385a132cec6d3c39fa711c1"); // prettier-ignore
                    const remotePubKey = b("030d417a46946384f88d5f3337267c5e579765875dc4daca813e21734b140639e7"); // prettier-ignore
                    const localPubKey = b("0394854aa6eab5b2a8122cc726e9dded053a2184d88256816826d6231c068d4a5b"); // prettier-ignore
                    const remoteDelayedPubKey = b("03fd5960528dc152014952efdb702a88f71e3c1653b2314431701ec77e57fde83c"); // prettier-ignore
                    const revocationPubKey = b("0212a140cd0c6539d07cd08dfe09984dec3251ea808b892efeac3ede9402bf2b19"); // prettier-ignore
                    const remotePaymentBasePoint = b("034f355bdcb7cc0af728ef3cceb9615d90684bb5b2ca5f859ab0f0b704075871aa"); // prettier-ignore
                    const localPaymentBasePoint = b("032c0b7cf95324a07d05398b240174dc0c2be444d96b159aa6c7f7b1e668680991"); // prettier-ignore

                    const commitmentNumber = 42;
                    const fundingOutPoint = OutPoint.fromString("8984484a580b825b9972d7adb15050b3ab624ccd731946b3eeddb92f4e7ef6be:0"); // prettier-ignore
                    const fundingSats = Value.fromSats(10000000);
                    const dustLimitSats = Value.fromSats(546);

                    const feePerKw = BigInt(fixture.FeePerKw);
                    const remoteMsat = Value.fromMilliSats(fixture.LocalBalance);
                    const localMsat = Value.fromMilliSats(fixture.RemoteBalance);

                    const htlcs = [
                        new Htlc(
                            BigInt(0),
                            HtlcDirection.Offered,
                            Value.fromMilliSats(1000000),
                            500,
                            Buffer.from(
                                "0000000000000000000000000000000000000000000000000000000000000000",
                                "hex",
                            ),
                        ),
                        new Htlc(
                            BigInt(1),
                            HtlcDirection.Offered,
                            Value.fromMilliSats(2000000),
                            501,
                            Buffer.from(
                                "0101010101010101010101010101010101010101010101010101010101010101",
                                "hex",
                            ),
                        ),
                        new Htlc(
                            BigInt(0),
                            HtlcDirection.Accepted,
                            Value.fromMilliSats(2000000),
                            502,
                            Buffer.from(
                                "0202020202020202020202020202020202020202020202020202020202020202",
                                "hex",
                            ),
                        ),
                        new Htlc(
                            BigInt(1),
                            HtlcDirection.Accepted,
                            Value.fromMilliSats(3000000),
                            503,
                            Buffer.from(
                                "0303030303030303030303030303030303030303030303030303030303030303",
                                "hex",
                            ),
                        ),
                        new Htlc(
                            BigInt(2),
                            HtlcDirection.Offered,
                            Value.fromMilliSats(4000000),
                            504,
                            Buffer.from(
                                "0404040404040404040404040404040404040404040404040404040404040404",
                                "hex",
                            ),
                        ),
                    ];

                    const localTx = TxFactory.createCommitment(
                        true,
                        commitmentNumber,
                        remotePaymentBasePoint,
                        localPaymentBasePoint,
                        fundingOutPoint,
                        dustLimitSats,
                        feePerKw,
                        remoteDelay,
                        remoteMsat,
                        localMsat,
                        revocationPubKey,
                        remoteDelayedPubKey,
                        localPubKey,
                        true,
                        remotePubKey,
                        localPubKey,
                        fixture.UseTestHtlcs ? htlcs : [],
                    );

                    const fundingWitnessScript = ScriptFactory.fundingScript(
                        openFundingPubKey,
                        acceptFundingPubKey,
                    );

                    const remoteSig = Buffer.from(fixture.LocalSigHex + "01", "hex");
                    const localSig = Buffer.from(fixture.RemoteSigHex + "01", "hex");

                    localTx.inputs[0].witness.push(new Witness(Buffer.alloc(0)));
                    if (openFundingPubKey.compare(acceptFundingPubKey) < 0) {
                        localTx.inputs[0].witness.push(new Witness(remoteSig));
                        localTx.inputs[0].witness.push(new Witness(localSig));
                    } else {
                        localTx.inputs[0].witness.push(new Witness(localSig));
                        localTx.inputs[0].witness.push(new Witness(remoteSig));
                    }
                    localTx.inputs[0].witness.push(
                        new Witness(fundingWitnessScript.serializeCmds()),
                    );

                    expect(localTx.serialize().toString("hex")).to.equal(
                        fixture.ExpectedCommitmentTxHex,
                    );
                });
            }
        });
    });
});
