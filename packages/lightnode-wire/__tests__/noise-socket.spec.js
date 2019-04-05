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
    it('should emit close event when socket is closed', done => {
      socket.end.yields();

      let sut = new NoiseSocket({ socket, noiseState });

      sut.on('close', () => done());
      sut.end();
    });
    it('should return the instance', () => {
      let sut = new NoiseSocket({ socket, noiseState });
      expect(sut.end()).to.equal(sut);
    });
  });

  describe('._terminate', () => {
    it('should emit error if there is one', done => {
      let sut = new NoiseSocket({ socket, noiseState });
      sut.on('error', () => done());
      sut._terminate(new Error('bye'));
    });
    it('should call end on the socket', () => {
      let sut = new NoiseSocket({ socket, noiseState });
      sut._terminate();
      expect(socket.end.called).to.be.true;
    });
  });

  describe('._connected', () => {
    describe('when initiator', () => {
      it('should send initialize the handshake', () => {
        let sut = new NoiseSocket({ socket, noiseState, initiator: true });
        sandbox.stub(sut, '_initiateHandshake');
        sut._onConnected();
        expect(sut._initiateHandshake.called).to.be.true;
      });

      it('should terminate on act1 message generation failure', () => {
        let sut = new NoiseSocket({ socket, noiseState, initiator: true });

        sandbox.stub(sut, '_initiateHandshake').throws(new Error('boom'));
        let spy = sinon.spy(sut, '_terminate');
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
      sandbox.stub(sut, '_terminate');
    });

    it('should throw when INITIATOR_INITIATING', () => {
      sut._handshakeState = NoiseSocket.HANDSHAKE_STATE.INITIATOR_INITIATING;
      sut._onData();
      expect(sut._terminate.called).to.be.true;
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

    it('should throw when UNKOWN', () => {
      sut._handshakeState = NoiseSocket.HANDSHAKE_STATE.READY;
      sut._readState = -1;
      sut._onData();
      expect(sut._terminate.called).to.be.true;
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

      it('should transition to state READY_FOR_LEN', () => {
        let sut = new NoiseSocket({ socket, noiseState });
        sut._processResponderReply();
        expect(sut._readState).to.equal(2);
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
        expect(sut._readState).to.equal(3);
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
