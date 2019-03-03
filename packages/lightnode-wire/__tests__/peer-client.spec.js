const { expect } = require('chai');
const sinon = require('sinon');
const PeerClient = require('../lib/peer-client');
const PingPongState = require('../lib/pingpong-state');

function createFakePeerClient() {
  let client = new PeerClient();
  let noiseState = {
    initialize: sinon.stub(),
    initiatorAct1: sinon.stub().resolves('act1'),
    initiatorAct2: sinon.stub(),
    initiatorAct3: sinon.stub().resolves('act3'),
    decryptLength: sinon.stub(),
    decryptMessage: sinon.stub(),
  };
  client.noiseState = noiseState;
  client.pingPongState = sinon.stub(new PingPongState());
  return client;
}

describe('peer-client', () => {
  let sut;
  before(() => {
    sut = createFakePeerClient();
    sut.socket = {
      write: sinon.stub(),
      read: sinon.stub(),
    };
  });

  describe('when connection is established', () => {
    it('should send the initial handshake', async () => {
      await sut._onConnected();
      expect(sut.socket.write.args[0][0]).to.equal('act1');
    });
    it('should transition to awaiting_handshake_reply', () => {
      expect(sut.state).to.equal(PeerClient.states.awaiting_handshake_reply);
    });
  });

  describe('when awaiting handshake reply and message received', () => {
    it('should process the reply and finalize the handshake', async () => {
      sut.socket.read.onCall(0).resolves('act2');
      sut.sendMessage = sinon.stub();
      await sut._onData();

      expect(sut.socket.write.args[1][0]).to.equal('act3');
    });
    it('should construct and send an init message', async () => {
      expect(sut.sendMessage.args[0][0].type).to.equal(16);
      expect(sut.sendMessage.args[0][0].globalFeatures.toNumber()).to.equal(0);
      expect(sut.sendMessage.args[0][0].localFeatures.toNumber()).to.equal(0);
    });
    it('should transition to awaiting_init_reply', () => {
      expect(sut.state).to.equal(PeerClient.states.awaiting_init_reply);
    });
  });

  describe('when init reply is receieved', () => {
    it('should capture the init', async () => {
      sut.socket.read.onCall(1).resolves(Buffer.alloc(18));
      sut.socket.read.onCall(2).resolves(Buffer.alloc(6));
      sut.noiseState.decryptLength.returns(6);
      sut.noiseState.decryptMessage.returns(Buffer.from('001000000000', 'hex'));
      await sut._onData();
      expect(sut.remoteInit.type).to.equal(16);
      expect(sut.remoteInit.globalFeatures.toNumber()).to.equal(0);
      expect(sut.remoteInit.localFeatures.toNumber()).to.equal(0);
    });
    it('should set state to awaiting_message_length', () => {
      expect(sut.state).to.equal(PeerClient.states.awaiting_message_length);
    });
  });
});
