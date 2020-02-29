// tslint:disable: no-unused-expression
import { expect } from "chai";
import { InitMessage } from "../../lib/messages/init-message";

describe("InitMessage", () => {
  it("should have correct default values", () => {
    const obj = new InitMessage();
    expect(obj.type).to.equal(16);
    expect(obj.globalFeatures.toNumber()).to.equal(0);
    expect(obj.localFeatures.toNumber()).to.equal(0);
  });

  it("should set localDataLossProtect", () => {
    const obj = new InitMessage();
    obj.localDataLossProtect = true;
    expect(obj.localDataLossProtect).to.be.true;
    expect(obj.localFeatures.toNumber()).to.equal(2);
  });

  it("should unset localDataLossProtect", () => {
    const obj = new InitMessage();
    obj.localFeatures.set(0);
    obj.localFeatures.set(1);
    obj.localDataLossProtect = false;
    expect(obj.localFeatures.toNumber()).to.equal(0);
  });

  it("should set localInitialRoutingSync", () => {
    const obj = new InitMessage();
    obj.localInitialRoutingSync = true;
    expect(obj.localInitialRoutingSync).to.be.true;
    expect(obj.localFeatures.toNumber()).to.equal(8);
  });

  it("should unset localInitialRoutingSync", () => {
    const obj = new InitMessage();
    obj.localFeatures.set(3);
    obj.localInitialRoutingSync = false;
    expect(obj.localFeatures.toNumber()).to.equal(0);
  });

  it("should set localUpfrontShutdownScript", () => {
    const obj = new InitMessage();
    obj.localUpfrontShutdownScript = true;
    expect(obj.localUpfrontShutdownScript).to.be.true;
    expect(obj.localFeatures.toNumber()).to.equal(32);
  });

  it("should unset localUpfrontShutdownScript", () => {
    const obj = new InitMessage();
    obj.localFeatures.set(4);
    obj.localFeatures.set(5);
    obj.localUpfrontShutdownScript = false;
    expect(obj.localFeatures.toNumber()).to.equal(0);
  });

  it("should set localGossipQueries", () => {
    const obj = new InitMessage();
    obj.localGossipQueries = true;
    expect(obj.localGossipQueries).to.be.true;
    expect(obj.localFeatures.toNumber()).to.equal(128);
  });

  it("should unset localGossipQueries", () => {
    const obj = new InitMessage();
    obj.localFeatures.set(6);
    obj.localFeatures.set(7);
    obj.localGossipQueries = false;
    expect(obj.localFeatures.toNumber()).to.equal(0);
  });

  describe(".serialize", () => {
    it("should serialize type", () => {
      const obj = new InitMessage();
      const result = obj.serialize();
      expect(result.toString("hex")).to.equal("001000000000");
    });

    it("should serialize globalFeatures", () => {
      const obj = new InitMessage();
      obj.globalFeatures.set(0);
      const result = obj.serialize();
      expect(result.toString("hex")).to.equal("00100001010000");
    });

    it("should serialize localFeatures", () => {
      const obj = new InitMessage();
      obj.localFeatures.set(3);
      const result = obj.serialize();
      expect(result.toString("hex")).to.equal("00100000000108");
    });
  });

  describe(".deserialize", () => {
    const remote = "0010000102000182";

    it("should deserialize type", () => {
      const result = InitMessage.deserialize(Buffer.from(remote, "hex"));
      expect(result.type).to.equal(16);
    });

    it("should deserialize globalFeatures", () => {
      const result = InitMessage.deserialize(Buffer.from(remote, "hex"));
      expect(result.globalFeatures.toNumber()).to.equal(0x2);
    });

    it("should deserialize localFeatures", () => {
      const result = InitMessage.deserialize(Buffer.from(remote, "hex"));
      expect(result.localFeatures.toNumber()).to.equal(0x82);
    });
  });
});
