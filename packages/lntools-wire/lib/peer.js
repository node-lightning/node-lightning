const assert = require('assert');
const { EventEmitter } = require('events');
const winston = require('winston');
const noise = require('@lntools/noise');
const MessageFactory = require('./message-factory');
const InitMessage = require('./messages/init-message');
const PingPongState = require('./pingpong-state');

const PeerStates = {
  pending: 0,
  awaiting_peer_init: 1,
  ready: 100,
};

class Peer extends EventEmitter {
  /**

   */
  constructor({ initRoutingSync = false } = {}) {
    super();

    this.state = Peer.states.pending;

    /** @type NoiseSocket */
    this.socket;

    /** @type number */
    this.messageCounter = 0;

    /** @type boolean */
    this.initRoutingSync = initRoutingSync;

    /** @type PingPongState */
    this.pingPongState = new PingPongState(this);
  }

  connect({ localSecret, remoteSecret, host, port = 9735 }) {
    this.socket = noise.connect({ localSecret, remoteSecret, host, port });
    this.socket.on('ready', this._onSocketReady.bind(this));
    this.socket.on('end', this._onSocketClose.bind(this));
    this.socket.on('close', this._onSocketClose.bind(this));
    this.socket.on('error', this._onSocketError.bind(this));
    this.socket.on('data', this._onSocketData.bind(this));
  }

  /**
    Writes the message on the NoiseSocket

    @param {any} m

    @returns boolean
   */
  sendMessage(m) {
    assert.ok(this.state == PeerStates.ready, new Error('Peer is not ready'));

    winston.debug('sending msg', JSON.stringify(m));
    m = m.serialize();
    return this.socket.write(m);
  }

  disconnect() {
    if (this.pingPongState) this.pingPongState.onDisconnecting();
    this.socket.disconnect();
  }

  /////////////////////////////////////////////////////////

  _onSocketReady() {
    // now that we're connected, we need to wait for the remote reply
    // before any other messages can be receieved or sent
    this.state = PeerStates.awaiting_peer_init;

    // blast off our init message
    this._sendInitMessage();
  }

  _onSocketEnd() {
    if (this.pingPongState) this.pingPongState.onDisconnecting();
    this.emit('end');
  }

  _onSocketClose() {
    this.emit('close');
  }

  _onSocketError(err) {
    // end the connection if we received an error
    this.socket.end();

    // emit what error we recieved
    this.emit('error', err);
  }

  _onSocketData(raw) {
    try {
      if (this.state === PeerStates.awaiting_peer_init) {
        this._processPeerInitMessage(raw);
      } else {
        this._processMessage(raw);
      }
    } catch (err) {
      // we have a problem, kill connectinon with the client
      this.socket.end();

      // emit the error event
      this.emit('error', err);
    }
  }

  /**
    Sends the initialization message to the peer.
   */
  _sendInitMessage() {
    // construct the init message
    let initMessage = new InitMessage();

    // set initialization messages
    initMessage.localInitialRoutingSync = this.initRoutingSync;

    // fire off the init message
    let m = initMessage.serialize();
    this.socket.write(m);
  }

  /**
    Processes the initialization message sent by the remote peer.
    Once this is successfully completed, the state is transitioned
    to `active` and

    @param {Buffer} raw
   */
  _processPeerInitMessage(raw) {
    // deserialize message
    let m = MessageFactory.deserialize(raw);
    winston.info('peer initialized ' + JSON.stringify(m));

    // ensure we got an InitMessagee
    assert.ok(m instanceof InitMessage, new Error('Expecting InitMessage'));

    // store the init messagee in case we need to refer to it
    this.remoteInit = m;

    // start other state now that peer is initialized
    this.pingPongState.start();

    // transition state to ready
    this.state = PeerStates.ready;

    // emit ready event
    this.emit('ready');
  }

  /**
    Process the raw message sent by the peer. These messages are
    processed after the initialization message has been received.

    @param {Buffer} raw
   */
  _processMessage(raw) {
    // deserialize the message
    let m = MessageFactory.deserialize(raw);

    // ensure pingpong state is updated
    if (m) {
      this.pingPongState.onMessage(m);

      // emit the message
      this.emit('message', m);
    }
  }
}

Peer.states = PeerStates;

module.exports = Peer;
