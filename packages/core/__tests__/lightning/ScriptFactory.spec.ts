import { sha256 } from "@node-lightning/crypto";
import { expect } from "chai";
import { ScriptFactory } from "../../lib/lightning/ScriptFactory";

describe("ScriptFactory", () => {
    const b = (hex: string) => Buffer.from(hex, "hex");

    const localDelay = 144;
    // const localFundingPrivKey = b("30ff4956bbdd3222d44cc5e8a1261dab1e07957bdac5ae88fe3261ef321f3749"); // prettier-ignore
    const localFundingPubKey = b("023da092f6980e58d2c037173180e9a465476026ee50f96695963e8efe436f54eb"); // prettier-ignore
    const remoteFundingPubKey = b("030e9f7b623d2ccc7c9bd44d66d5ce21ce504c0acf6385a132cec6d3c39fa711c1"); // prettier-ignore
    // const localPrivKey = b("bb13b121cdc357cd2e608b0aea294afca36e2b34cf958e2e6451a2f274694491"); // prettier-ignore
    const localPubKey = b("030d417a46946384f88d5f3337267c5e579765875dc4daca813e21734b140639e7"); // prettier-ignore
    const remotePubKey = b("0394854aa6eab5b2a8122cc726e9dded053a2184d88256816826d6231c068d4a5b"); // prettier-ignore
    const localDelayedPubKey = b("03fd5960528dc152014952efdb702a88f71e3c1653b2314431701ec77e57fde83c"); // prettier-ignore
    const localRevocationPubKey = b("0212a140cd0c6539d07cd08dfe09984dec3251ea808b892efeac3ede9402bf2b19"); // prettier-ignore

    describe(".fundingScript", () => {
        it("BOLT 3 test vector", () => {
            const script = ScriptFactory.fundingScript(localFundingPubKey, remoteFundingPubKey);
            expect(script.serializeCmds().toString("hex")).to.equal(
                "5221023da092f6980e58d2c037173180e9a465476026ee50f96695963e8efe436f54eb21030e9f7b623d2ccc7c9bd44d66d5ce21ce504c0acf6385a132cec6d3c39fa711c152ae",
            );
        });
    });

    describe(".toLocalScript", () => {
        it("BOLT3 test vector", () => {
            const script = ScriptFactory.toLocalScript(
                localRevocationPubKey,
                localDelayedPubKey,
                localDelay,
            );
            expect(script.serializeCmds().toString("hex")).to.equal(
                "63210212a140cd0c6539d07cd08dfe09984dec3251ea808b892efeac3ede9402bf2b1967029000b2752103fd5960528dc152014952efdb702a88f71e3c1653b2314431701ec77e57fde83c68ac",
            );
        });
    });

    describe("#.offeredHtlcScript()", () => {
        it("BOLT3 test vector", () => {
            const script = ScriptFactory.offeredHtlcScript(
                sha256(
                    Buffer.from(
                        "0202020202020202020202020202020202020202020202020202020202020202",
                        "hex",
                    ),
                ),
                localRevocationPubKey,
                localPubKey,
                remotePubKey,
            );
            expect(script.serializeCmds().toString("hex")).to.equal(
                "76a91414011f7254d96b819c76986c277d115efce6f7b58763ac67210394854aa6eab5b2a8122cc726e9dded053a2184d88256816826d6231c068d4a5b7c820120876475527c21030d417a46946384f88d5f3337267c5e579765875dc4daca813e21734b140639e752ae67a914b43e1b38138a41b37f7cd9a1d274bc63e3a9b5d188ac6868",
            );
        });
    });

    describe("#.receivedHtlcScript()", () => {
        it("BOLT3 test vector", () => {
            const script = ScriptFactory.receivedHtlcScript(
                sha256(
                    Buffer.from(
                        "0000000000000000000000000000000000000000000000000000000000000000",
                        "hex",
                    ),
                ),
                500,
                localRevocationPubKey,
                localPubKey,
                remotePubKey,
            );
            expect(script.serializeCmds().toString("hex")).to.equal(
                "76a91414011f7254d96b819c76986c277d115efce6f7b58763ac67210394854aa6eab5b2a8122cc726e9dded053a2184d88256816826d6231c068d4a5b7c8201208763a914b8bcb07f6344b42ab04250c86a6e8b75d3fdbbc688527c21030d417a46946384f88d5f3337267c5e579765875dc4daca813e21734b140639e752ae677502f401b175ac6868",
            );
        });
    });
});
