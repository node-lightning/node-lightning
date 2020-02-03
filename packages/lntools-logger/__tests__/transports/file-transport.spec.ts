import { expect } from "chai";
import fs from "fs";
import { FileTransport } from "../../lib/transports/file-transport";

const filePath = "test.log";

describe("ConsoleTransport", () => {
  describe(".write", () => {
    after(() => {
      fs.unlinkSync(filePath);
    });
    it("should write to the console", () => {
      const sut = new FileTransport(filePath);
      sut.write("hello");

      const actual = fs.readFileSync(filePath, { encoding: "utf8" });
      expect(actual).to.equal("hello\n");
    });
  });
});
