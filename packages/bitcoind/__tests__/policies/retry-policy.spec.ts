import { expect } from "chai";
import sinon from "sinon";
import { ConstantBackoff } from "../../lib/policies/constant-backoff";
import { RetryPolicy } from "../../lib/policies/retry-policy";

describe("RetryPolicy", () => {
    it("no retries", async () => {
        const expectedValue = 1000;
        const fn = sinon.stub();
        fn.onCall(0).resolves(expectedValue);

        const backoff = new ConstantBackoff(50);
        const policy = new RetryPolicy(5, backoff);
        const result = await policy.execute(fn);
        expect(result).to.equal(expectedValue);
    });

    it("retries once", async () => {
        const expectedValue = 1000;
        const fn = sinon.stub();
        fn.onCall(0).rejects(new Error());
        fn.onCall(1).resolves(expectedValue);

        const backoff = new ConstantBackoff(50);
        const policy = new RetryPolicy(5, backoff);
        const result = await policy.execute(fn);
        expect(result).to.equal(expectedValue);
    });

    it("retries multiple times", async () => {
        const expectedValue = 1000;
        const fn = sinon.stub();
        fn.onCall(0).rejects(new Error());
        fn.onCall(1).rejects(new Error());
        fn.onCall(2).rejects(new Error());
        fn.onCall(3).rejects(new Error());
        fn.onCall(4).resolves(expectedValue);

        const backoff = new ConstantBackoff(50);
        const policy = new RetryPolicy(5, backoff);
        const result = await policy.execute(fn);
        expect(result).to.equal(expectedValue);
    });

    it("fails after max retries", async () => {
        // const expectedValue = 1000;
        const fn = sinon.stub();
        fn.onCall(0).rejects(new Error());
        fn.onCall(1).rejects(new Error());
        fn.onCall(2).rejects(new Error());
        fn.onCall(3).rejects(new Error());
        fn.onCall(4).rejects(new Error("good"));

        const backoff = new ConstantBackoff(50);
        const policy = new RetryPolicy(5, backoff);
        try {
            await policy.execute(fn);
            throw new Error();
        } catch (ex) {
            expect(ex.message).to.equal("good");
        }
    });
});
