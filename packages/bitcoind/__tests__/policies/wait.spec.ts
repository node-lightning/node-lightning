import { expect } from "chai";
import { wait } from "../../lib/policies/wait";

describe("wait", () => {
    it("waits", async () => {
        const start = Date.now();
        await wait(100);
        const end = Date.now();
        expect(end - start).to.be.gte(100);
    });
});
