import { expect } from "chai";
import sinon from "sinon";
import { ConstantBackoff } from "../../lib/policies/constant-backoff";

describe("ConstantBackoff", () => {
    it("single call", async () => {
        const stub = sinon.stub();
        const sut = new ConstantBackoff(1000, stub);
        await sut.backoff();
        expect(stub.args[0][0]).to.equal(1000);
    });

    it("multiple class", async () => {
        const stub = sinon.stub();
        const sut = new ConstantBackoff(100, stub);
        await sut.backoff();
        await sut.backoff();
        await sut.backoff();
        expect(stub.args[0][0]).to.equal(100);
        expect(stub.args[1][0]).to.equal(100);
        expect(stub.args[2][0]).to.equal(100);
    });
});
