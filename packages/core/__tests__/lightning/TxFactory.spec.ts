import * as crypto from "@node-lightning/crypto";
import {
    Script,
    Value,
    TxBuilder,
    bip69InputSorter,
    bip69OutputSorter,
    LockTime,
} from "@node-lightning/bitcoin";
import { expect } from "chai";
import { TxFactory } from "../../lib/lightning/TxFactory";

describe("TxFactory", () => {
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
});
