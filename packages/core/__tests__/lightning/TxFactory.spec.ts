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

describe("TxFactory", () => {
    const b = (hex: string) => Buffer.from(hex, "hex");

    const localDelay = 144;
    const localFundingPrivKey = b("30ff4956bbdd3222d44cc5e8a1261dab1e07957bdac5ae88fe3261ef321f3749"); // prettier-ignore
    const localFundingPubKey = b("023da092f6980e58d2c037173180e9a465476026ee50f96695963e8efe436f54eb"); // prettier-ignore
    const remoteFundingPubKey = b("030e9f7b623d2ccc7c9bd44d66d5ce21ce504c0acf6385a132cec6d3c39fa711c1"); // prettier-ignore
    const localPrivKey = b("bb13b121cdc357cd2e608b0aea294afca36e2b34cf958e2e6451a2f274694491"); // prettier-ignore
    const localPubKey = b("030d417a46946384f88d5f3337267c5e579765875dc4daca813e21734b140639e7"); // prettier-ignore
    const remotePubKey = b("0394854aa6eab5b2a8122cc726e9dded053a2184d88256816826d6231c068d4a5b"); // prettier-ignore
    const localDelayedPubKey = b("03fd5960528dc152014952efdb702a88f71e3c1653b2314431701ec77e57fde83c"); // prettier-ignore
    const localRevocationPubKey = b("0212a140cd0c6539d07cd08dfe09984dec3251ea808b892efeac3ede9402bf2b19"); // prettier-ignore

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
        const commitmentNumber = 42;
        const fundingOutPoint = OutPoint.fromString("8984484a580b825b9972d7adb15050b3ab624ccd731946b3eeddb92f4e7ef6be:0"); // prettier-ignore
        const fundingSats = Value.fromSats(10000000);

        const localDustLimitSats = Value.fromSats(546);
        const localFeeRatePerKw = BigInt(15000);

        const localPaymentBasePoint = b("034f355bdcb7cc0af728ef3cceb9615d90684bb5b2ca5f859ab0f0b704075871aa"); // prettier-ignore
        const remotePaymentBasePoint = b("032c0b7cf95324a07d05398b240174dc0c2be444d96b159aa6c7f7b1e668680991"); // prettier-ignore

        const localMsat = Value.fromMilliSats(7000000000);
        const remoteMsat = Value.fromMilliSats(3000000000);

        it("BOLT3 Test Vector 1 - local commitment, no HTLCs", () => {
            const tx = TxFactory.createCommitment(
                commitmentNumber,
                localPaymentBasePoint,
                remotePaymentBasePoint,
                fundingOutPoint,
                localDustLimitSats,
                localFeeRatePerKw,
                true,
                localMsat,
                remoteMsat,
                localRevocationPubKey,
                localDelayedPubKey,
                localDelay,
                remotePubKey,
            );

            const commitScript = ScriptFactory.fundingScript(
                localFundingPubKey,
                remoteFundingPubKey,
            );

            const remoteSig = Buffer.from("3045022100f51d2e566a70ba740fc5d8c0f07b9b93d2ed741c3c0860c613173de7d39e7968022041376d520e9c0e1ad52248ddf4b22e12be8763007df977253ef45a4ca3bdb7c001", "hex"); // prettier-ignore
            const localSig = tx.signSegWitv0(0, commitScript, localFundingPrivKey, fundingSats);
            expect(localSig.toString("hex")).to.equal(
                "3044022051b75c73198c6deee1a875871c3961832909acd297c6b908d59e3319e5185a46022055c419379c5051a78d00dbbce11b5b664a0c22815fbcc6fcef6b1937c383693901",
            );

            tx.inputs[0].witness.push(new Witness(Buffer.alloc(0)));
            if (localFundingPubKey.compare(remoteFundingPubKey) < 0) {
                tx.inputs[0].witness.push(new Witness(localSig));
                tx.inputs[0].witness.push(new Witness(remoteSig));
            } else {
                tx.inputs[0].witness.push(new Witness(remoteSig));
                tx.inputs[0].witness.push(new Witness(localSig));
            }
            tx.inputs[0].witness.push(new Witness(commitScript.serializeCmds()));

            expect(tx.serialize().toString("hex")).to.equal(
                "02000000000101bef67e4e2fb9ddeeb3461973cd4c62abb35050b1add772995b820b584a488489000000000038b02b8002c0c62d0000000000160014ccf1af2f2aabee14bb40fa3851ab2301de84311054a56a00000000002200204adb4e2f00643db396dd120d4e7dc17625f5f2c11a40d857accc862d6b7dd80e0400473044022051b75c73198c6deee1a875871c3961832909acd297c6b908d59e3319e5185a46022055c419379c5051a78d00dbbce11b5b664a0c22815fbcc6fcef6b1937c383693901483045022100f51d2e566a70ba740fc5d8c0f07b9b93d2ed741c3c0860c613173de7d39e7968022041376d520e9c0e1ad52248ddf4b22e12be8763007df977253ef45a4ca3bdb7c001475221023da092f6980e58d2c037173180e9a465476026ee50f96695963e8efe436f54eb21030e9f7b623d2ccc7c9bd44d66d5ce21ce504c0acf6385a132cec6d3c39fa711c152ae3e195220",
            );
        });
    });
});
