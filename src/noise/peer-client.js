const net = require('net');
const winston = require('winston');
const NoiseState = require('./noise-state');
const { generateKey } = require('../wallet/key');
const MessageFactory = require('../messages/message-factory');

class PeerClient {
  constructor({ localSecret, remoteSecret, host, port = 9735 }) {
    let ephemeralSecret = generateKey();
    this.noiseState = new NoiseState({ ls: localSecret, rs: remoteSecret, es: ephemeralSecret });
    this.host = host;
    this.port = port;

    this._buffer = Buffer.alloc(0);
    this.completedAct = 0;
  }

  async connect() {
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
    winston.debug('sending', JSON.stringify(m));
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
      winston.debug('sending', m.toString('hex'));
      this.socket.write(m);
      this.completedAct = 1;
    } catch (err) {
      winston.error(err);
    }
  }

  async _onData() {
    try {
      if (this.completedAct === 1) {
        let m = this.socket.read(50);
        if (!m) return;

        m = await this.noiseState.initiatorAct2Act3(m);
        winston.debug('sending', m.toString('hex'));
        this.socket.write(m);
        this.completedAct = 3;

        // send init message
        await this.sendMessage(MessageFactory.construct(16));
        //
      } else if (this.completedAct === 3) {
        // read the length
        if (!this.l) {
          let lc = this.socket.read(18);
          if (!lc) return;
          this.l = await this.noiseState.decryptLength(lc);
        }

        // read the cipher
        let c = this.socket.read(this.l + 16);
        if (!c) return;

        // decrypt the cipher
        let m = await this.noiseState.decryptMessage(c);
        m = MessageFactory.deserialize(m);
        if (m) winston.debug('received', JSON.stringify(m));

        // reset l for next message
        this.l = undefined;
      }
    } catch (err) {
      winston.error(err);
    }
  }
}

module.exports = PeerClient;
