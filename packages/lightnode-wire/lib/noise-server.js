const assert = require('assert');
const { EventEmitter } = require('events');
const { Server } = require('net');
const crypto = require('@lightnode/crypto');
const NoiseState = require('./noise-state');
const NoiseSocket = require('./noise-socket');
const NoiseError = require('./noise-error');

class NoiseServer extends EventEmitter {
  /**
    NoiseServer is a TCP server that wraps socket instances
    with the NoiseSocket class. This class is an event emitter
    with the same interface as net.Server.

    The constructor take arguments that will be used by the
    NoiseState.

    @param {Buffer} opts.localSecret 32-byte buffer with
    the local private key

    @param {Function} [opts.ephemeralSecretFactory] optional
    function for creating the ephemeral secret
   */
  constructor(opts = {}, connListener) {
    super();

    // localSecret assertions
    this.localSecret = opts.localSecret;

    // ephemeralSecretFactory
    assert.ok(
      !opts.ephemeralSecretFactory || typeof opts.ephemeralSecretFactory === 'function',
      new NoiseError('ephemeralSecretFactory must be a function')
    );
    this.ephemeralSecretFactory = opts.ephemeralSecretFactory || crypto.generateRandomKey;

    // construct and bind the server
    this._server = new Server(opts);
    this._server.on('connection', this._onConnection.bind(this));
    this._server.on('error', err => this.emit('error', err));
    this._server.on('close', () => this.emit('close'));
    this._server.on('listening', () => this.emit('listening'));

    if (connListener) this.on('connection', connListener);
  }

  _onConnection(socket) {
    let ls = this.localSecret;
    let es = this.ephemeralSecretFactory();
    let noiseState = new NoiseState({ ls, es });
    let noiseSocket = new NoiseSocket({ socket, noiseState, initiator: false });
    this.emit('connection', noiseSocket);
  }

  address() {
    return this._server.address();
  }

  close(cb) {
    this._server.close(cb);
  }

  getConnections(cb) {
    this._server.getConnections(cb);
  }

  listen(port, host, listenerHandle) {
    this._server.listen(port, host, listenerHandle);
  }

  get listening() {
    return this._server.listening;
  }

  get maxConnections() {
    return this._server.maxConnections;
  }
}

module.exports = NoiseServer;
