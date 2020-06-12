import { expect } from "chai";
import sinon from "sinon";
import { ExponentialBackoff } from "../../lib/policies/exponential-backoff";

describe("ExponentialBackoff", () => {
    it("single call", async () => {
        const stub = sinon.stub();
        const sut = new ExponentialBackoff(1000, 2, stub);
        await sut.backoff();
        expect(stub.args[0][0]).to.equal(1000);
    });

    it("multiple class", async () => {
        const stub = sinon.stub();
        const sut = new ExponentialBackoff(1000, 2, stub);
        await sut.backoff();
        await sut.backoff();
        await sut.backoff();
        await sut.backoff();
        expect(stub.args[0][0]).to.equal(1000);
        expect(stub.args[1][0]).to.equal(2000);
        expect(stub.args[2][0]).to.equal(4000);
        expect(stub.args[3][0]).to.equal(8000);
    });
});
