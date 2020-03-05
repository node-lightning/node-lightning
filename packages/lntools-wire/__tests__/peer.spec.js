const { EventEmitter } = require("events");
const { expect } = require("chai");
const sinon = require("sinon");
const noise = require("@lntools/noise");
const { Peer } = require("../lib/peer");
const { PingPongState } = require("../lib/pingpong-state");
const { InitMessage } = require("../lib/messages/init-message");
const { createFakeLogger } = require("./_test-utils");

class FakeSocket extends EventEmitter {
  constructor() {
    super();
    this.write = sinon.stub();
    this.end = sinon.stub();
  }
}

class FakeMessage {
  constructor(msg) {
    this.msg = msg;
  }
  serialize() {
    return Buffer.from(this.msg);
  }
}

describe("Peer", () => {
  /** @type Peer */
  let sut;

  /** @type sinon.SinonSandbox */
  let sandbox;

  /** @type noise.NoiseSocket */
  let socket;

  beforeEach(() => {
    const initMessageFactory = () => {
      let msg = new InitMessage();
      msg.localDataLossProtect = true;
      return msg;
    };
    const rpk = Buffer.alloc(32, 1);
    const logger = createFakeLogger();
    sut = new Peer({ rpk, initMessageFactory, logger });
    sut.socket = socket = new FakeSocket();
    sut.pingPongState = sinon.createStubInstance(PingPongState);
    sandbox = sinon.createSandbox();
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe(".connect()", () => {
    beforeEach(() => {
      sandbox.stub(noise, "connect").returns(socket);
      sandbox.stub(sut, "_onSocketReady");
      sandbox.stub(sut, "_onSocketEnd");
      sandbox.stub(sut, "_onSocketClose");
      sandbox.stub(sut, "_onSocketError");
      sandbox.stub(sut, "_onSocketData");
      sut.connect();
    });

    it("should bind to ready", () => {
      socket.emit("ready");
      expect(sut._onSocketReady.called).to.be.true;
    });

    it("should bind end", () => {
      socket.emit("end");
      expect(sut._onSocketEnd.called).to.be.true;
    });

    it("should bind close", () => {
      socket.emit("close");
      expect(sut._onSocketClose.called).to.be.true;
    });

    it("should bind error", () => {
      socket.emit("error");
      expect(sut._onSocketError.called).to.be.true;
    });

    it("should bind data", () => {
      socket.emit("data");
      expect(sut._onSocketData.called).to.be.true;
    });
  });

  describe(".sendMessage()", () => {
    it("should throw when not ready", () => {
      expect(() => sut.write(new FakeMessage())).to.throw();
    });

    it("should send the serialized message", () => {
      let input = new FakeMessage("test");
      sut.state = Peer.states.ready;
      sut.sendMessage(input);
      expect(socket.write.args[0][0]).to.deep.equal(Buffer.from("test"));
    });

    it("should emit a sending message", done => {
      let input = new FakeMessage("test");
      sut.state = Peer.states.ready;
      sut.on("sending", () => done());
      sut.sendMessage(input);
    });
  });

  describe(".disconnect()", () => {
    it("should stop the socket", () => {
      sut.disconnect();
      expect(sut.socket.end.called).to.be.true;
    });
  });

  describe("._onSocketReady()", () => {
    it("should transition state to awaiting_peer_init", () => {
      sut._onSocketReady();
      expect(sut.state).to.equal(Peer.states.awaiting_peer_init);
    });

    it("should send the init message to the peer", () => {
      sut._onSocketReady();
      expect(socket.write.args[0][0]).to.deep.equal(Buffer.from("00100000000102", "hex"));
    });
  });

  describe("_onSocketEnd", () => {
    it("should emit the end event", done => {
      sut.on("end", () => done());
      sut._onSocketEnd();
    });
  });

  describe("_onSocketClose", () => {
    it("should stop the ping pong state", () => {
      sut._onSocketClose();
      expect(sut.pingPongState.onDisconnecting.called).to.be.true;
    });

    it("should emit the close event", done => {
      sut.on("close", () => done());
      sut._onSocketClose();
    });
  });

  describe("_onSocketError", () => {
    it("should emit error event", done => {
      sut.on("error", () => done());
      sut._onSocketError();
    });
  });

  describe("_onSocketData", () => {
    beforeEach(() => {
      sandbox.stub(sut, "_processPeerInitMessage");
      sandbox.stub(sut, "_processMessage");
    });

    it("should read peer init message when awaiting_peer_init state", () => {
      sut.state = Peer.states.awaiting_peer_init;
      sut._onSocketData("data");
      expect(sut._processPeerInitMessage.called).to.be.true;
    });

    it("should process message when in ready state", () => {
      sut.state = Peer.states.ready;
      sut._onSocketData("datat");
      expect(sut._processMessage.called).to.be.true;
    });

    describe("on error", () => {
      it("should close the socket", () => {
        sut.state = Peer.states.ready;
        sut._processMessage.throws(new Error("boom"));
        sut.on("error", () => {});
        sut._onSocketData("data");
        expect(socket.end.called).to.be.true;
      });

      it("should emit an error event", done => {
        sut.state = Peer.states.ready;
        sut._processMessage.throws(new Error("boom"));
        sut.on("error", () => done());
        sut._onSocketData("data");
      });
    });
  });

  describe("_sendInitMessage", () => {
    it("should send the initialization message", () => {
      sut._sendInitMessage();
      expect(socket.write.args[0][0]).to.deep.equal(Buffer.from("00100000000102", "hex"));
    });
  });

  describe("_processPeerInitMessage", () => {
    let input;

    beforeEach(() => {
      input = Buffer.from("001000000000", "hex");
    });

    it("it should fail if not init message", () => {
      input = Buffer.from("001100000000", "hex");
      expect(() => sut._processPeerInitMessage(input)).to.throw();
    });

    it("should store the init message", () => {
      sut._processPeerInitMessage(input);
      expect(sut.remoteInit).to.be.instanceof(InitMessage);
    });

    it("should start ping state", () => {
      sut._processPeerInitMessage(input);
      expect(sut.pingPongState.start.called).to.be.true;
    });

    it("should change the state to ready", () => {
      sut._processPeerInitMessage(input);
      expect(sut.state).to.equal(Peer.states.ready);
    });

    it("should emit ready", done => {
      sut.on("ready", () => done());
      sut._processPeerInitMessage(input);
    });
  });

  describe("_processMessage", () => {
    let input;

    beforeEach(() => {
      input = Buffer.from("001000000000", "hex");
    });

    describe("when valid message", () => {
      it("should log with ping service", () => {
        sut._processMessage(input);
        expect(sut.pingPongState.onMessage.called).to.be.true;
      });

      it("should emit the message", done => {
        sut.on("message", () => done());
        sut._processMessage(input);
      });
    });
  });
});
