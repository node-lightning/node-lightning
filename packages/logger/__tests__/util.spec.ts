// tslint:disable: no-unused-expression
import { expect } from "chai";
import { LogLevel } from "../lib/log-level";
import { shouldLog } from "../lib/util";

describe(".shouldLog", () => {
    it("should return false when invalid log level", () => {
        expect(shouldLog(LogLevel.Info, LogLevel.Debug)).to.be.false;
    });
    it("should return false when log level below current log level setting", () => {
        expect(shouldLog(LogLevel.Info, LogLevel.Debug)).to.be.false;
    });
    it("should return true when at current log level setting", () => {
        expect(shouldLog(LogLevel.Info, LogLevel.Info)).to.be.true;
    });
    it("should return true when above current log level setting", () => {
        expect(shouldLog(LogLevel.Info, LogLevel.Error)).to.be.true;
    });
});
