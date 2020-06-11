import { expect } from "chai";
import sinon from "sinon";
import { ConsoleTransport } from "../../lib/transports/console-transport";

describe("ConsoleTransport", () => {
    describe(".write", () => {
        it("should write to the console", () => {
            const stub = {
                log: sinon.stub(),
            };
            const sut = new ConsoleTransport(stub as any);
            sut.write("hello");
            expect(stub.log.args[0]).to.deep.equal(["hello"]);
        });
    });
});
