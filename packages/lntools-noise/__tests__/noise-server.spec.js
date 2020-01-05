const { expect } = require("chai");
const { NoiseServer } = require("../lib/noise-server");

describe("NoiseServer", () => {
  let ls = Buffer.from('2121212121212121212121212121212121212121212121212121212121212121', 'hex'); // prettier-ignore

  describe("constructor", () => {
    it("should throw if the ephemeralSecretFactory is not a function", () => {
      expect(() => {
        new NoiseServer({ ls, esFactory: 1 });
      }).to.throw();
    });

    it("should bind the error event", done => {
      let sut1 = new NoiseServer({ ls });
      sut1.listen({ port: 10000, host: "127.0.0.1" });
      let sut2 = new NoiseServer({ ls });
      sut2.listen({ port: 10000, host: "127.0.0.1" });
      sut2.on("error", () => {
        sut1.close();
        sut2.close();
        done();
      });
    });
  });

  describe(".address()", () => {
    it("should return the address", done => {
      let sut;
      sut = new NoiseServer({ ls });
      sut.listen({ port: 10000, host: "127.0.0.1" }, () => {
        try {
          let result = sut.address();
          expect(result.address).to.equal("127.0.0.1");
          expect(result.family).to.equal("IPv4");
          expect(result.port).to.equal(10000);
          done();
        } finally {
          sut.close();
        }
      });
    });
  });

  describe(".listening", () => {
    it("should return false prior to listening", () => {
      let sut = new NoiseServer({ ls });
      expect(sut.listening).to.be.false;
    });
    it("should return true once listening", done => {
      let sut;
      sut = new NoiseServer({ ls });
      sut.listen({ port: 10000, host: "127.0.0.1" }, () => {
        try {
          expect(sut.listening).to.be.true;
          done();
        } finally {
          sut.close();
        }
      });
    });
  });

  describe(".maxConnections", () => {
    it("should get / set the maxConnections", () => {
      let sut = new NoiseServer({ ls });
      sut.maxConnections = 1;
      expect(sut.maxConnections).to.equal(1);
    });
  });

  describe(".getConnections", () => {
    it("should return the connection count", done => {
      let sut = new NoiseServer({ ls });
      sut.getConnections((err, cnt) => {
        expect(cnt).to.equal(0);
        done();
      });
    });
  });
});
