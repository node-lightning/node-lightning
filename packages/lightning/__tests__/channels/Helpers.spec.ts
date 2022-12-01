import { expect } from "chai";
import { Helpers } from "../../lib/channels/Helpers";

describe(Helpers.name, () => {
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
