const { expect } = require('chai');
const winston = require('winston');
const net = require('net');
const sinon = require('sinon');
const NoiseState = require('../lib/noise-state');
const NoiseSocket = require('../lib/noise-socket');

/**
  These are low value unit tests that mostly assert implementation details.

  Need to add better tests that assert the NoiseSocket state transitions
  via a mocked socket or actual integration tests.
 */
describe('noise-socket', () => {
  let sandbox;

  /** @type NoiseState */
  let noiseState;

  /** @type Socket */
  let socket;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
    sandbox.stub(winston);
    noiseState = sandbox.createStubInstance(NoiseState);
    socket = sandbox.createStubInstance(net.Socket);
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('.end', () => {
    it('should call end on the socket', () => {
      let sut = new NoiseSocket({ socket, noiseState });
      sut.end();
      expect(socket.end.called).to.be.true;
    });
    it('should return the instance', () => {
      let sut = new NoiseSocket({ socket, noiseState });
      expect(sut.end()).to.equal(sut);
    });
  });

  describe('.destroy', () => {
    it('should call destroy on the socket', () => {
      let sut = new NoiseSocket({ socket, noiseState });
      sut.destroy();
      expect(socket.destroy.called).to.be.true;
    });
    it('should call destroy on the socket with the error', () => {
      let sut = new NoiseSocket({ socket, noiseState });
      let err = new Error();
      sut.destroy(err);
      expect(socket.destroy.args[0][0]).to.equal(err);
    });
    it('should return the instance', () => {
      let sut = new NoiseSocket({ socket, noiseState });
      expect(sut.destroy()).to.equal(sut);
    });
  });

  describe('._connected', () => {
    describe('when initiator', () => {
      it('should send initialize the handshake', () => {
        let sut = new NoiseSocket({ socket, noiseState, rpk: Buffer.alloc(33) });
        sandbox.stub(sut, '_initiateHandshake');
        sut._onConnected();
        expect(sut._initiateHandshake.called).to.be.true;
      });

      it('should terminate on act1 message generation failure', () => {
        let sut = new NoiseSocket({ socket, noiseState, rpk: Buffer.alloc(33) });

        sandbox.stub(sut, '_initiateHandshake').throws(new Error('boom'));
        let spy = sinon.spy(sut, 'destroy');
        sut.on('error', () => {});

        sut._onConnected();

        expect(spy.called).to.be.true;
      });
    });
  });

  describe('_onData', () => {
    let sut;
    beforeEach(() => {
      sut = new NoiseSocket({ socket, noiseState });
      sandbox.stub(sut, '_processInitiator');
      sandbox.stub(sut, '_processInitiatorReply');
      sandbox.stub(sut, '_processResponderReply');
      sandbox.stub(sut, '_processPacketLength');
      sandbox.stub(sut, '_processPacketBody');
      sandbox.stub(sut, 'destroy');
    });

    it('should throw when INITIATOR_INITIATING', () => {
      sut._handshakeState = NoiseSocket.HANDSHAKE_STATE.INITIATOR_INITIATING;
      sut._onData();
      expect(sut.destroy.called).to.be.true;
    });

    it('should process responder act1 when AWAITING_INITIATOR', () => {
      sut._handshakeState = NoiseSocket.HANDSHAKE_STATE.AWAITING_INITIATOR;
      sut._onData();
      expect(sut._processInitiator.called).to.be.true;
    });

    it('should process responder act3 when AWAITING_INITIATOR_REPLY', () => {
      sut._handshakeState = NoiseSocket.HANDSHAKE_STATE.AWAITING_INITIATOR_REPLY;
      sut._onData();
      expect(sut._processInitiatorReply.called).to.be.true;
    });

    it('should process initiator act2 when AWAITING_RESPONDER_REPLY', () => {
      sut._handshakeState = NoiseSocket.HANDSHAKE_STATE.AWAITING_RESPONDER_REPLY;
      sut._onData();
      expect(sut._processResponderReply.called).to.be.true;
    });

    it('should process length when READY_FOR_LEN', () => {
      sut._handshakeState = NoiseSocket.HANDSHAKE_STATE.READY;
      sut._readState = NoiseSocket.READ_STATE.READY_FOR_LEN;
      sut._onData();
      expect(sut._processPacketLength.called).to.be.true;
    });

    it('should process body when READY_FOR_BODY', () => {
      sut._handshakeState = NoiseSocket.HANDSHAKE_STATE.READY;
      sut._readState = NoiseSocket.READ_STATE.READY_FOR_BODY;
      sut._onData();
      expect(sut._processPacketBody.called).to.be.true;
    });

    it('should return false when BLOCKED', () => {
      sut._handshakeState = NoiseSocket.HANDSHAKE_STATE.READY;
      sut._readState = NoiseSocket.READ_STATE.BLOCKED;
      sut._onData();
      expect(sut._processPacketLength.called).to.be.false;
      expect(sut._processPacketBody.called).to.be.false;
    });

    it('should throw when UNKOWN', () => {
      sut._handshakeState = NoiseSocket.HANDSHAKE_STATE.READY;
      sut._readState = -1;
      sut._onData();
      expect(sut.destroy.called).to.be.true;
    });
  });

  describe('_initiateHandshake', () => {
    it('should send act1 message', () => {
      noiseState.initiatorAct1.returns('act1 message');

      let sut = new NoiseSocket({ socket, noiseState, initiator: true });
      sut._initiateHandshake();

      expect(socket.write.args[0][0]).is.equal('act1 message');
    });

    it('should transition state to AWAITING_RESPONDER_REPLY', () => {
      let sut = new NoiseSocket({ socket, noiseState, initiator: true });
      sut._initiateHandshake();
      expect(sut._readState).to.equal(NoiseSocket.HANDSHAKE_STATE.AWAITING_RESPONDER_REPLY);
    });
  });

  describe('_processInitiator', () => {
    describe('when not enough data', () => {
      it('should return false', () => {
        let sut = new NoiseSocket({ socket, noiseState });
        expect(sut._processInitiator()).to.not.be.true;
      });
    });

    describe('when data', () => {
      beforeEach(() => {
        socket.read.returns(Buffer.alloc(50));
        noiseState.recieveAct2.returns('act2 message');
      });

      it('should send act2 reply', () => {
        let sut = new NoiseSocket({ socket, noiseState });
        sut._processInitiator();
        expect(socket.write.args[0][0]).to.equal('act2 message');
      });

      it('should transition to AWAITING_INITIATOR_REPLY', () => {
        let sut = new NoiseSocket({ socket, noiseState });
        sut._processInitiator();
        expect(sut._handshakeState).to.equal(NoiseSocket.HANDSHAKE_STATE.AWAITING_INITIATOR_REPLY);
      });
    });
  });

  describe('_processInitiatorReply', () => {
    describe('when not enough data', () => {
      it('should return false', () => {
        let sut = new NoiseSocket({ socket, noiseState });
        expect(sut._processInitiatorReply()).to.not.be.true;
      });
    });

    describe('when data', () => {
      beforeEach(() => {
        socket.read.returns(Buffer.alloc(66));
      });

      it('should transition to READY', () => {
        let sut = new NoiseSocket({ socket, noiseState });
        sut._processInitiatorReply();
        expect(sut._handshakeState).to.equal(NoiseSocket.HANDSHAKE_STATE.READY);
      });

      it('should emit connect event', done => {
        let sut = new NoiseSocket({ socket, noiseState });
        sut.on('connect', () => done());
        sut._processInitiatorReply();
      });

      it('should emit ready event', done => {
        let sut = new NoiseSocket({ socket, noiseState });
        sut.on('ready', () => done());
        sut._processInitiatorReply();
      });

      it('should return true to indicate data was processed', () => {
        let sut = new NoiseSocket({ socket, noiseState });
        expect(sut._processInitiatorReply()).to.be.true;
      });
    });
  });

  describe('_processResponderReply', () => {
    describe('when not enough data', () => {
      it('should return if not enough data', () => {
        let sut = new NoiseSocket({ socket, noiseState });
        expect(sut._processResponderReply()).to.not.be.true;
      });
    });

    describe('when data', () => {
      beforeEach(() => {
        socket.read.returns(Buffer.alloc(50));
        noiseState.initiatorAct3.returns('act3 message');
      });

      it('should write act3 message', () => {
        let sut = new NoiseSocket({ socket, noiseState });
        sut._processResponderReply();
        expect(socket.write.args[0][0]).to.equal('act3 message');
      });

      it('should transition to state READY', () => {
        let sut = new NoiseSocket({ socket, noiseState });
        sut._processResponderReply();
        expect(sut._handshakeState).to.equal(NoiseSocket.HANDSHAKE_STATE.READY);
      });

      it('should emit connect event', done => {
        let sut = new NoiseSocket({ socket, noiseState });
        sut.on('connect', () => done());
        sut._processResponderReply();
      });

      it('should emit ready event', done => {
        let sut = new NoiseSocket({ socket, noiseState });
        sut.on('ready', () => done());
        sut._processResponderReply();
      });

      it('should return true to indicate data was processed', () => {
        let sut = new NoiseSocket({ socket, noiseState });
        expect(sut._processResponderReply()).to.be.true;
      });
    });
  });

  describe('_processPacketLength', () => {
    describe('when not enough data', () => {
      it('should return false', () => {
        let sut = new NoiseSocket({ socket, noiseState });
        expect(sut._processPacketLength()).to.not.be.true;
      });
    });

    describe('when data', () => {
      beforeEach(() => {
        socket.read.returns(Buffer.alloc(18));
        noiseState.decryptLength.returns(24);
      });

      it('should store the decrypted length', () => {
        let sut = new NoiseSocket({ socket, noiseState });
        sut._processPacketLength();
        expect(sut._l).to.equal(24);
      });

      it('should transition to READY_FOR_BODY', () => {
        let sut = new NoiseSocket({ socket, noiseState });
        sut._processPacketLength();
        expect(sut._readState).to.equal(NoiseSocket.READ_STATE.READY_FOR_BODY);
      });

      it('should return true indicating data was processed', () => {
        let sut = new NoiseSocket({ socket, noiseState });
        expect(sut._processPacketLength()).to.be.true;
      });
    });
  });

  describe('_processPacketBody', () => {
    describe('when not enough data', () => {
      it('should return false', () => {
        let sut = new NoiseSocket({ socket, noiseState });
        expect(sut._processPacketBody()).to.not.be.true;
      });
    });

    describe('when data', () => {
      beforeEach(() => {
        socket.read.returns(Buffer.alloc(80));
        noiseState.decryptMessage.returns('some message');
      });

      it('should increase the messagesReceived counter', () => {
        let sut = new NoiseSocket({ socket, noiseState });
        sandbox.stub(sut, 'push').returns(true);
        sut._processPacketBody();
        expect(sut.messagesReceived).to.equal(1);
      });

      it('should push the decrypted message onto the read buffer', () => {
        let sut = new NoiseSocket({ socket, noiseState });
        sandbox.stub(sut, 'push').returns(true);
        sut._processPacketBody();
        expect(sut.push.args[0][0]).to.equal('some message');
      });

      it('should transition to READY_FOR_LEN', () => {
        let sut = new NoiseSocket({ socket, noiseState });
        sandbox.stub(sut, 'push').returns(true);
        sut._processPacketBody();
        expect(sut._readState).to.equal(2);
      });

      it('should return true', () => {
        let sut = new NoiseSocket({ socket, noiseState });
        sandbox.stub(sut, 'push').returns(true);
        expect(sut._processPacketBody()).to.be.true;
      });
    });

    describe('when data and read backpressure', () => {
      beforeEach(() => {
        socket.read.returns(Buffer.alloc(80));
        noiseState.decryptMessage.returns('some message');
      });

      it('should transition to state BLOCKED', () => {
        let sut = new NoiseSocket({ socket, noiseState });
        sandbox.stub(sut, 'push').returns(false);
        sut._processPacketBody();
        expect(sut._readState).to.equal(4);
      });

      it('should return false', () => {
        let sut = new NoiseSocket({ socket, noiseState });
        sandbox.stub(sut, 'push').returns(false);
        expect(sut._processPacketBody()).to.be.false;
      });
    });
  });

  describe('_read', () => {
    it('should abort if handshake not ready', done => {
      let sut = new NoiseSocket({ socket, noiseState });
      sut._handshakeState = NoiseSocket.HANDSHAKE_STATE.BLOCKED;
      sandbox.stub(sut, '_onData');
      sut._read();
      setTimeout(() => {
        try {
          expect(sut._onData.called).to.be.false;
          done();
        } catch (ex) {
          done(ex);
        }
      }, 1);
    });

    it('should trigger read asynchrously to prevent cycle', done => {
      let sut = new NoiseSocket({ socket, noiseState });
      sut._handshakeState = NoiseSocket.HANDSHAKE_STATE.READY;
      sandbox.stub(sut, '_onData');
      sut._read();
      expect(sut._onData.called).to.be.false;
      setTimeout(() => {
        try {
          expect(sut._onData.called).to.be.true;
          done();
        } catch (ex) {
          done(ex);
        }
      }, 1);
    });
    it('should transition from BLOCKED TO READY_FOR_LEN', () => {
      let sut = new NoiseSocket({ socket, noiseState });
      sut._handshakeState = NoiseSocket.HANDSHAKE_STATE.READY;
      sut._readState = NoiseSocket.READ_STATE.BLOCKED;
      sut._read();
      expect(sut._readState).to.equal(NoiseSocket.READ_STATE.READY_FOR_LEN);
    });
  });

  describe('_write', () => {
    it('shouuld write the encrypted message', () => {
      let sut = new NoiseSocket({ socket, noiseState });
      noiseState.encryptMessage.returns('encrypted message');
      sut._write('some data', null, sinon.stub());
      expect(socket.write.args[0][0]).to.equal('encrypted message');
    });
  });
});
