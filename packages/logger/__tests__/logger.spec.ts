// tslint:disable: no-unused-expression
import { expect } from "chai";
import sinon from "sinon";
import { LogLevel } from "../lib/log-level";
import { Logger } from "../lib/logger";
import { ITransport } from "../lib/transport";

describe("Logger", () => {
    let transport: ITransport;
    let sut: Logger;

    beforeEach(() => {
        transport = { write: sinon.stub() };
        sut = new Logger();
        sut.transports.push(transport);
    });

    it("should default log level of Info", () => {
        expect(sut.level).to.equal(LogLevel.Info);
    });

    it("should ignore messages below setting", () => {
        const logger = sut.sub("area");
        expect((transport.write as sinon.SinonSpy).callCount).to.equal(0);
        logger.debug("testing");
        expect((transport.write as sinon.SinonSpy).callCount).to.equal(0);
    });

    describe("create logger with instance", () => {
        it("should create logger with instance", () => {
            const logger = sut.sub("area", "instance");
            expect(logger.area).to.equal("area");
            expect(logger.instance).to.equal("instance");
        });

        it("should write a message to the transport", () => {
            const logger = sut.sub("area", "instance");
            logger.info("testing");
            expect((transport.write as sinon.SinonSpy).args[0][0]).to.match(
                /\d\d\d\d-\d\d-\d\dT\d\d:\d\d:\d\d\.\d\d\dZ \[INF\] area instance: testing/,
            );
        });
    });

    describe("nested sub logger", () => {
        it("should point to root", () => {
            sut.level = LogLevel.Debug;
            const level2 = sut.sub("level2");
            const level3 = sut.sub("level3");
            level3.debug("test");
            expect((transport.write as sinon.SinonSpy).args[0][0]).contain("test");
        });
    });

    describe("create logger without instance", () => {
        it("should create logger without an instance", () => {
            const logger = sut.sub("area");
            expect(logger.area).to.equal("area");
            expect(logger.instance).to.be.undefined;
        });

        it("should write a message to the transport", () => {
            const logger = sut.sub("area");
            logger.info("testing");
            expect((transport.write as sinon.SinonSpy).args[0][0]).to.match(
                /\d\d\d\d-\d\d-\d\dT\d\d:\d\d:\d\d\.\d\d\dZ \[INF\] area: testing/,
            );
        });
    });

    const fixtures = [
        { fn: "trace", level: LogLevel.Trace },
        { fn: "debug", level: LogLevel.Debug },
        { fn: "info", level: LogLevel.Info },
        { fn: "warn", level: LogLevel.Warn },
        { fn: "error", level: LogLevel.Error },
    ];

    for (const { fn, level } of fixtures) {
        describe("." + fn, () => {
            beforeEach(() => {
                sut = new Logger("area", "instance");
                sut.level = LogLevel.Trace;
                sut.transports.push(transport);
            });

            it("should have message with level " + level, () => {
                sut[fn]("testing");
                expect((transport.write as sinon.SinonSpy).args[0][0]).to.match(
                    new RegExp("[" + level + "]"),
                );
            });

            it("should have message with area", () => {
                sut[fn]("testing");
                expect((transport.write as sinon.SinonSpy).args[0][0]).to.match(/ area/);
            });

            it("should have message with instance", () => {
                sut[fn]("testing");
                expect((transport.write as sinon.SinonSpy).args[0][0]).to.match(/ instance/);
            });

            it("should have message with actual message", () => {
                sut[fn]("testing");
                expect((transport.write as sinon.SinonSpy).args[0][0]).to.match(/ testing$/);
            });

            it("should call write with single variable message", () => {
                sut[fn](5);
                expect((transport.write as sinon.SinonSpy).args[0][0]).to.match(/5$/);
            });

            it("should call write with sprintf message", () => {
                sut[fn]("testing %s, %d, %j", "hello", 5, { foo: "bar" });
                expect((transport.write as sinon.SinonSpy).args[0][0]).to.contain(
                    'testing hello, 5, {"foo":"bar"}',
                );
            });

            it("should work with deeply nested objects", () => {
                sut[fn]("%j", { depth: { depth: { depth: { depth: { depth: 5 } } } } });
                expect((transport.write as sinon.SinonSpy).args[0][0]).to.contain(
                    '{"depth":{"depth":{"depth":{"depth":{"depth":5}}}}}',
                );
            });

            it("should work with objects with toJSON", () => {
                sut[fn]("%j", {
                    test: 1n,
                    toJSON() {
                        return { test: this.test.toString() };
                    },
                });
                expect((transport.write as sinon.SinonSpy).args[0][0]).to.contain('{"test":"1"}');
            });

            it("should work not use toJSON if no formatter", () => {
                sut[fn]({
                    test: 1n,
                    toJSON() {
                        return { test: this.test.toString() };
                    },
                });
                expect((transport.write as sinon.SinonSpy).args[0][0]).to.contain(
                    "{ test: 1n, toJSON: [Function: toJSON] }",
                );
            });

            it("should call write with variadic message", () => {
                sut[fn]("testing", 1, 2, 3, 4, "5");
                expect((transport.write as sinon.SinonSpy).args[0][0]).to.contain(
                    "testing 1 2 3 4 5",
                );
            });

            it("should work unbounded", () => {
                const debug = sut[fn];
                debug("testing");
                expect((transport.write as sinon.SinonSpy).called).to.be.true;
            });
        });
    }
});
