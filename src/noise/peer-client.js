const net = require('net');
const winston = require('winston');
const NoiseState = require('./noise-state');
const { generateKey } = require('../wallet/key');
const MessageFactory = require('../messages/message-factory');

class PeerClient {
  constructor() {
    this.state = PeerClient.states.pending;
  }

  async connect({ localSecret, remoteSecret, host, port = 9735 }) {
    let ephemeralSecret = generateKey();
    this.noiseState = new NoiseState({ ls: localSecret, rs: remoteSecret, es: ephemeralSecret });
    this.host = host;
    this.port = port;
    await this._open();
  }

  async _open() {
    winston.debug('connecting to', this.host, this.port);
    this.socket = net.connect({ host: this.host, port: this.port }, this._onConnected.bind(this));
    this.socket.on('error', this._onError.bind(this));
    this.socket.on('readable', this._onData.bind(this));
    this.socket.on('timeout', this._onClose.bind(this));
    this.socket.on('close', this._onClose.bind(this));
  }

  async sendMessage(m) {
    winston.debug('sending msg', JSON.stringify(m));
    m = m.serialize();
    m = await this.noiseState.encryptMessage(m);
    this.socket.write(m);
  }

  _onClose() {
    winston.error('connection closed');
  }

  _onError(err) {
    winston.error(err);
  }

  async _onConnected() {
    try {
      await this.noiseState.initialize();
      let m = await this.noiseState.initiatorAct1();
      this.socket.write(m);
      this.state = PeerClient.states.awaiting_handshake_reply;
    } catch (err) {
      winston.error(err);
    }
  }

  async _processHandshakeReply() {
    // must read 50 bytes
    let m = this.socket.read(50);
    if (!m) return;

    // process reply and create final act of handshake
    m = await this.noiseState.initiatorAct2Act3(m);
    this.socket.write(m);

    // send init message
    await this.sendMessage(MessageFactory.construct(16));

    this.state = PeerClient.states.awaiting_init_reply;
  }

  async _processInitReply() {
    if (!this.l) {
      // read the length
      let lc = this.socket.read(18);
      if (!lc) return;

      // capture and store length
      this.l = await this.noiseState.decryptLength(lc);
    }

    // read the cipher
    let c = this.socket.read(this.l + 16);
    if (!c) return;

    // decrypt the cipher
    let m = await this.noiseState.decryptMessage(c);
    m = MessageFactory.deserialize(m);

    winston.debug('peer initialized', JSON.stringify(m));
    this.remoteInit = m;
    this.state = PeerClient.states.awaiting_message_length;
    this.l = null;
  }

  async _onData() {
    try {
      switch (this.state) {
        case PeerClient.states.awaiting_handshake_reply:
          await this._processHandshakeReply();
          break;
        case PeerClient.states.awaiting_init_reply:
          await this._processInitReply();
          break;
        case PeerClient.states.awaiting_message_length:
          await this._processMessageLength();
          await this._processMessageBody();
          break;
        case PeerClient.states.awaiting_message_body:
          await this._processMessageBody();
          break;
      }
    } catch (err) {
      winston.error(err);
    }
  }

  async _processMessageLength() {
    // read the length
    let lc = this.socket.read(18);
    if (!lc) return;

    // immediate transition
    this.state = PeerClient.states.awaiting_message_body;

    // capture and store length
    this.l = await this.noiseState.decryptLength(lc);
  }

  async _processMessageBody() {
    // read the cipher
    let c = this.socket.read(this.l + 16);
    if (!c) return;

    // immediate state transition
    this.state = PeerClient.states.awaiting_message_length;

    // decrypt the cipher
    let m = await this.noiseState.decryptMessage(c);
    m = MessageFactory.deserialize(m);
    if (m) winston.debug('received', JSON.stringify(m));
  }
}

PeerClient.states = {
  pending: 'pending',
  awaiting_handshake_reply: 'awaiting_handshake_reply',
  awaiting_init_reply: 'awaiting_init_reply',
  awaiting_message_length: 'awaiting_message_length',
  awaiting_message_body: 'awaiting_message_body',
};

module.exports = PeerClient;
