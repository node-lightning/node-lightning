const fs = require("fs");
const { expect } = require("chai");
const { FileTransport } = require("../../lib/transports/file-transport");

const filePath = "test.log";

describe("ConsoleTransport", () => {
  describe(".write", () => {
    after(() => {
      fs.unlinkSync(filePath);
    });
    it("should write to the console", () => {
      let sut = new FileTransport(filePath);
      sut.write("hello");

      let actual = fs.readFileSync(filePath, { encoding: "utf8" });
      expect(actual).to.equal("hello\n");
    });
  });
});
