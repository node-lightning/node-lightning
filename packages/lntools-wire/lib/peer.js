const assert = require('assert');
const { EventEmitter } = require('events');
const { manager } = require('@lntools/logger');
const noise = require('@lntools/noise');
const MessageFactory = require('./message-factory');
const { InitMessage } = require('./messages/init-message');
const { PingPongState } = require('./pingpong-state');

const PeerStates = {
  pending: 0,
  awaiting_peer_init: 1,
  ready: 100,
};

class Peer extends EventEmitter {
  /**
    Peer is an EventEmitter that layers the Lightning Network wire
    protocol ontop of an @lntools/noise NoiseSocket.

    Peer itself is a state-machine with three states:
    1. pending
    2. awaiting_peer_init
    3. ready

    The Peer instance starts in `pending` until the underlying NoiseSocket
    has connected.

    It then immediately sends the InitMessage as specified in the Peer
    constructor.

    At this point, the Peer transitions to `awaiting_peer_init`.

    Once the remote peer has sent its InitMessage, the state is
    transitioned to `ready` and the Peer can be begin sending and
    receiving messages.

    Once the peer is in the `ready` state it will begin emitting `message`
    events when it receives new messages from the peer.

    The Peer will also start a PingPong state machine to manage sending
    and receiving Pings and Pongs as defined in BOLT01

    A choice (probably wrongly) was made to make Peer an EventEmitter
    instead of a DuplexStream operating in object mode. We need to keep
    the noise socket in flowing mode (instead of paused) because we will
    not know the length of messages until after we have deserialized the
    message. This makes it a challenge to implement a DuplexStream that
    emits objects (such as messages).

    @emits ready the underlying socket has performed its handshake and
    initialization message swap has occurred.

    @emits message a new message has been received. Only sent after the
    `ready` event has fired.

    @emits rawmessage outputs the message as a raw buffer instead of
    a deserialized message.

    @emits error emitted when there is an error processing a message.
    The underlying socket will be closed after this event is emitted.

    @emits close emitted when the connection to the peer has completedly
    closed.

    @emits end emitted when the connection to the peer is ending.
   */
  constructor({ initRoutingSync = false } = {}) {
    super();

    /** @type PeerState */
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

  /**
    Connect to the remote peer and binds socket events into the Peer.

    @param {Object} opts
    @param {Buffer} opts.ls local secret as a 32-byte private key on
    elliptic curve secp256k1
    @param {Buffer} opts.rpk remote node's known public key as a 33-byte
    compressed public key reperesenting the affine coorindate on elliptic
    curve secp256k1
    @param {string} [opts.host]
    @param {number} [opts.port]
   */
  connect({ ls, rpk, host, port = 9735 }) {
    // construct a logger before connecting
    this.logger = manager.create('PEER', rpk.toString('hex'));

    this.socket = noise.connect({ ls, rpk, host, port });
    this.socket.on('ready', this._onSocketReady.bind(this));
    this.socket.on('end', this._onSocketEnd.bind(this));
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
    m = m.serialize();
    return this.socket.write(m);
  }

  /**
    Closes the socket
   */
  disconnect() {
    this.socket.end();
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
    this.emit('end');
  }

  _onSocketClose() {
    if (this.pingPongState) this.pingPongState.onDisconnecting();
    this.emit('close');
  }

  _onSocketError(err) {
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
    initMessage.localDataLossProtect = true;

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
    this.logger.info('peer initialized ' + JSON.stringify(m));

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
      this.emit('rawmessage', raw);
      this.emit('message', m);
    }
  }
}

Peer.states = PeerStates;

module.exports.Peer = Peer;
