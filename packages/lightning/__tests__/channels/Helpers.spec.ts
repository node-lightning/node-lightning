import { Value } from "@node-lightning/bitcoin";
import { expect } from "chai";
import { Helpers } from "../../lib/channels/Helpers";
import { createFakeChannelWallet } from "../_test-utils";

describe(Helpers.name, () => {
    describe(Helpers.prototype.checkWalletHasFunds.name, () => {
        it("should return wallet", async () => {
            // arrange
            const wallet = createFakeChannelWallet();
            wallet.checkWalletHasFunds.resolves(true);
            const helpers = new Helpers(wallet);

            // act
            const result = await helpers.checkWalletHasFunds(Value.fromSats(100_000));

            // assert
            expect(result).to.equal(true);
        });
    });

    describe(Helpers.prototype.createTempChannelId.name, () => {
        it("should return a random 32-byte nonce", () => {
            // arrange
            const helpers = new Helpers(undefined);

            // act
            const result = helpers.createTempChannelId();

            // assert
            expect(result.length).to.equal(32);
        });
    });
});
