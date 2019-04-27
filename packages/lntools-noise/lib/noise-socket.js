// @ts-check

const assert = require('assert');
const winston = require('winston');
const { Duplex } = require('stream');
const { Socket } = require('net');
const NoiseError = require('./noise-error');

// Types below are required for TypeScript checking
// eslint-disable-next-line no-unused-vars
const NoiseState = require('./noise-state');

/**
  States that the handshake process can be in. States depend on
  whether the socket is the connection Initiator or Responder.

  Initiator:
    1.  create and send Iniatitor act1 and transition to
        AWAITING_RESPONDER_REPLY
    2.  process the Responder's reply as act2
    3.  create Initiator act3 reply to complete the handshake
        and transitions to READY

  Responder:
    1.  begins in AWAITING_INITIATOR waiting to receive act1
    2.  processes act1 and creates a reply as act2 and transitions
        to AWAITING_INITIATOR_REPLY
    3.  processes the Initiator's reply to complete the handshake
        and transition to READY

  @readonly
  @enum {number}
 */
const HANDSHAKE_STATE = {
  /**
    Initial state for the Initiator. Initiator will transition to
    AWAITING_RESPONDER_REPLY once act1 is completed and sent.
   */
  INITIATOR_INITIATING: 0,

  /**
    Responders begin in this state and wait for the Intiator to begin
    the handshake. Sockets originating from the NoiseServer will
    begin in this state.
  */
  AWAITING_INITIATOR: 1,

  /**
    Initiator has sent act1 and is awaiting the reply from the responder.
    Once received, the intiator will create the reply
  */
  AWAITING_RESPONDER_REPLY: 2,

  /**
    Responder has  sent a reply to the inititator, the Responder will be
    waiting for the final stage of the handshake sent by the Initiator.
  */
  AWAITING_INITIATOR_REPLY: 3,

  /**
    Responder/Initiator have completed the handshake and we're ready to
    start sending and receiving over the socket.
   */
  READY: 100,
};

/**
  @readonly
  @enum {number}
 */
const READ_STATE = {
  READY_FOR_LEN: 2,
  READY_FOR_BODY: 3,
  BLOCKED: 4,
};

class NoiseSocket extends Duplex {
  /**
    NoiseSocket is a Duplex Stream that wraps a standard TCP Socket
    and layers in the BOLT #8 implementation of the Noise Protocol
    Framework.

    This socket can be used for any communication that wants to
    benefit from the security and privacy enhancing used by the
    Noise Protocol Framework.

    @param {Object} opts
    @param {Socket} opts.socket standard TCP Socket from the net
      module that will be wrapped
    @param {NoiseState} opts.noiseState state machine for noise
      connections that is injected into the socket
    @param {Buffer} [opts.rs] remote public key when connecting to a
      remote server. When provided, makes the socket the noise
      state initiator.
   */
  constructor({ socket, noiseState, rs }) {
    super();

    // perform type assertions
    assert.ok(socket instanceof Socket,new NoiseError('socket argument must be an instance of Socket')); // prettier-ignore

    /**
      Remote public key as a 33-byte compressed public key for
      elliptic curve secp256k1
      @type {Buffer}
     */
    this.rs = rs;

    /**
      Indicates if the socket was the connection initiator
      which will determine how the handshake happens.

      @type Boolean
    */
    this.initiator = rs !== undefined;

    /**
      Controls the handshake process at the start of the connection.
      The socket is not readable until the handshake has been
      performed.

      @private
      @type HANDSHAKE_STATE
     */
    this._handshakeState = this.initiator
      ? HANDSHAKE_STATE.INITIATOR_INITIATING
      : HANDSHAKE_STATE.AWAITING_INITIATOR;

    /**
      Controls how reading and piping from the underlying
      TCP socket to the Duplex Streams read buffer works

      @private
      @type {READ_STATE}
     */
    this._readState = READ_STATE.READY_FOR_LEN;

    /**
      Private property that maintains the handshakes and
      encrypts and decrypts messages while maintaining the
      proper key rotation scheme used defined in BOLT #8.

      @private
      @type {NoiseState}
     */
    this._noiseState = noiseState;

    /** @type number */
    this.messagesReceived = 0;

    /** @type Socket */
    this._socket = socket;

    // TODO - implement proper close
    this._socket.on('close', hadError => this.emit('close', hadError));
    // TODO - configure connecting property
    this._socket.on('connect', this._onConnected.bind(this));
    this._socket.on('drain', () => this.emit('drain'));
    this._socket.on('end', () => this.emit('end'));
    this._socket.on('error', err => this.emit('error', err));
    this._socket.on('lookup', (e, a, f, h) => this.emit('lookup', e, a, f, h));
    this._socket.on('readable', this._onData.bind(this));
    this._socket.on('timeout', () => this.emit('timeout'));
  }

  /**
    Half-closes the socket. It is still possible that the opposite
    side is still sending data.

    @returns {NoiseSocket}
   */
  end() {
    this._socket.end();
    return this;
  }

  /**
    Destroys the socket and ensures that no more I/O activity happens
    on the socket. When an `err` is included, an 'error' event will
    be emitted and all listeners will receive the error as an
    argument.

    @param {Error} [err] optional error to send
    @returns {NoiseSocket}
   */
  destroy(err) {
    this._socket.destroy(err);
    return this;
  }

  _onConnected() {
    try {
      if (this.initiator) {
        this._initiateHandshake();
      }
    } catch (err) {
      this.destroy(err);
    }
  }

  /**
    _onData is triggered by the "readable" event on the
    underlying TCP socket. It is called each time there is new data
    received. It is responsible for reading data from the socket and
    performing the appropriate action given the current read state.

    @private
   */
  _onData() {
    try {
      // Loop while there was still data to process on the socket's
      // buffer. This will stop when we don't have enough data or
      // we encounter a back pressure issue;
      let readMore = true;
      do {
        if (this._handshakeState !== HANDSHAKE_STATE.READY) {
          switch (this._handshakeState) {
            // Initiator received data before initialized
            case HANDSHAKE_STATE.INITIATOR_INITIATING:
              throw new NoiseError('Pending state is invalid');

            // Responder Act1
            case HANDSHAKE_STATE.AWAITING_INITIATOR:
              readMore = this._processInitiator();
              break;

            // Responder Act3
            case HANDSHAKE_STATE.AWAITING_INITIATOR_REPLY:
              readMore = this._processInitiatorReply();
              break;

            // Initiator Act2
            case HANDSHAKE_STATE.AWAITING_RESPONDER_REPLY:
              readMore = this._processResponderReply();
              break;
          }
        } else {
          switch (this._readState) {
            case READ_STATE.READY_FOR_LEN:
              readMore = this._processPacketLength();
              break;
            case READ_STATE.READY_FOR_BODY:
              readMore = this._processPacketBody();
              break;
            case READ_STATE.BLOCKED:
              readMore = false;
              break;
            default:
              throw new NoiseError('Unknown read state');
          }
        }
      } while (readMore);
    } catch (err) {
      // Terminate on failures as we won't be able to recovery
      // since the noise state has rotated nonce and we won't
      // be able to any more data without additional errors.
      this.destroy(err);
    }
  }

  _initiateHandshake() {
    // create Initiator Act 1 message
    let m = this._noiseState.initiatorAct1(this.rs);

    // send message to Responder
    this._socket.write(m);

    // transition state
    this._handshakeState = HANDSHAKE_STATE.AWAITING_RESPONDER_REPLY;
  }

  _processInitiator() {
    // must read 50 bytes
    let m = this._socket.read(50);
    if (!m) return false;

    // validate initiator act1 message
    this._noiseState.receiveAct1(m);

    // create reply message
    m = this._noiseState.recieveAct2();

    // send the reply
    this._socket.write(m);

    // transition
    this._handshakeState = HANDSHAKE_STATE.AWAITING_INITIATOR_REPLY;

    // indicate processing was successful
    return true;
  }

  _processInitiatorReply() {
    // must read 66 bytes
    let m = this._socket.read(66);
    if (!m) return false;

    // validate initiator act3 message
    this._noiseState.receiveAct3(m);

    // transition
    this._handshakeState = HANDSHAKE_STATE.READY;

    // emit that we're ready!
    this.emit('connect');
    this.emit('ready');

    // return true to continue processing
    return true;
  }

  _processResponderReply() {
    // must read 50 bytes
    let m = this._socket.read(50);
    if (!m) return;

    // process reply
    this._noiseState.initiatorAct2(m);

    // create final act of the handshake
    m = this._noiseState.initiatorAct3();

    // send final handshake
    this._socket.write(m);

    // transition
    this._handshakeState = HANDSHAKE_STATE.READY;

    // emit that we're ready!
    this.emit('connect');
    this.emit('ready');

    // return true to continue processing
    return true;
  }

  _processPacketLength() {
    const LEN_CIPHER_BYTES = 2;
    const LEN_MAC_BYTES = 16;

    // Try to read the length cipher bytes and the length MAC bytes
    // If we cannot read the 18 bytes, the attempt to process the
    // message will abort.
    let lc = this._socket.read(LEN_CIPHER_BYTES + LEN_MAC_BYTES);
    if (!lc) return;

    // Decrypt the length including the MAC
    let l = this._noiseState.decryptLength(lc);

    // We need to store the value in a local variable in case
    // we are unable to read the message body in its entirety.
    // This allows us to skip the length read and prevents
    // nonce issues since we've already decrypted the length.
    this._l = l;

    // Transition state
    this._readState = READ_STATE.READY_FOR_BODY;

    // return true to continue reading
    return true;
  }

  _processPacketBody() {
    const MESSAGE_MAC_BYTES = 16;

    // With the length, we can attempt to read the message plus
    // the MAC for the message. If we are unable to read because
    // there is not enough data in the read buffer, we need to
    // store l. We are not able to simply unshift it becuase we
    // have already rotated the keys.
    let c = this._socket.read(this._l + MESSAGE_MAC_BYTES);
    if (!c) return;

    // Decrypt the full message cipher + MAC
    let m = this._noiseState.decryptMessage(c);

    // Now that we've read the message, we can remove the
    // cached length before we transition states
    this._l = null;

    // Increment the number of messages received
    this.messagesReceived++;

    // Push the message onto the read buffer for the consumer to
    // read. We are mindful of slow reads by the consumer and
    // will respect backpressure signals.
    let pushOk = this.push(m);
    if (pushOk) {
      this._readState = READ_STATE.READY_FOR_LEN;
      return true;
    } else {
      winston.debug('socket read is blocked');
      this._readState = READ_STATE.BLOCKED;
      return false;
    }
  }

  _read() {
    if (this._handshakeState !== HANDSHAKE_STATE.READY) {
      return;
    }

    if (this._readState === READ_STATE.BLOCKED) {
      winston.debug('socket read is unblocked');
      this._readState = READ_STATE.READY_FOR_LEN;
    }
    // Trigger a read but wait until the end of the event loop.
    // This is necessary when reading in paused mode where
    // _read was triggered by stream.read() originating inside
    // a "readable" event handler. Attempting to push more data
    // synchronously will not trigger another "readable" event.
    setImmediate(() => this._onData());
  }

  _write(data, encoding, cb) {
    winston.debug('sending ' + data.toString('hex'));
    let c = this._noiseState.encryptMessage(data);
    this._socket.write(c, cb);
  }

  _final() {}
}

NoiseSocket.READ_STATE = READ_STATE;
NoiseSocket.HANDSHAKE_STATE = HANDSHAKE_STATE;

module.exports = NoiseSocket;
