// @ts-check

const assert = require('assert');
const { EventEmitter } = require('events');
const { Server } = require('net');
const crypto = require('@lntools/crypto');
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

    @param {Object} opts
    @param {import('@lntools/crypto/lib/key').ECKey} opts.localSecret local secret
    used by the server
    @param {() => import('@lntools/crypto/lib/key').ECKey} [opts.ephemeralSecretFactory] optional
    function for creating the ephemeral secret used by each connection
   */
  constructor(opts, connListener) {
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
    this._server = new Server();
    this._server.on('connection', this._onConnection.bind(this));
    this._server.on('error', err => this.emit('error', err));
    this._server.on('close', () => this.emit('close'));
    this._server.on('listening', () => this.emit('listening'));

    if (connListener) this.on('connection', connListener);
  }

  /**
    Called when the socket receives a new socket connection. Emits the `connection` event.

    @private
    @param {import('net').Socket} socket
   */
  _onConnection(socket) {
    let ls = this.localSecret;
    let es = this.ephemeralSecretFactory();
    let noiseState = new NoiseState({ ls, es });
    let noiseSocket = new NoiseSocket({ socket, noiseState, initiator: false });
    this.emit('connection', noiseSocket);
  }

  /**
    Returns the address the server is listeening on. If the server is
    not listening, it will return undefined.

    @returns {string|import('net').AddressInfo}
   */
  address() {
    return this._server.address();
  }

  /**
    Stops the server from accepting new connections and keeps existing connections open.
    This function is asynchronous, the server is fully closed when all connections are
    ended and the server emits a `close` event. The optional `cb` event will be called
    once the `close` event occurs.

    @param {(err: Error) => void} [cb]
   */
  close(cb) {
    this._server.close(cb);
  }

  /**
    Asynchronously get the number of concurrent connections on the server. Works when sockets were sent to forks.
    @param {(error: Error, count: number) => void} cb
   */
  getConnections(cb) {
    this._server.getConnections(cb);
  }

  /**
    Start a server listening for connections. This method is asyncrhonous,
    once the server has started listening, the `listening` event will be
    emitted.

    @param {Object} opts Listen options

    @param {Number} opts.port Optional port to listen on.  If port is omitted or is 0,
    the operating system will assign an arbitrary unused port, which can be retrieved
    by using server.address().port after the 'listening' event has been emitted.

    @param {String} [opts.host] Optional host to listen on. If host is omitted, the server
    will accept connections on the unspecified IPv6 address (::) when IPv6 is available,
    or the unspecified IPv4 address (0.0.0.0) otherwise. In most operating systems,
    listening to the unspecified IPv6 address (::) may cause NoiseSocket to also
    listen on the unspecified IPv4 address (0.0.0.0).

    @param {Number} [opts.backlog] Optional value to specify the maximum length of the
    queue of pending connections. The actual length will be determined by the OS through
    sysctl settings such as tcp_max_syn_backlog and somaxconn on Linux. The default value
    of this parameter is 511 (not 512).

    @param {() => void} [callback] called when the server is listening. Automatically binds
    the function to the `listening` event.

    @returns {NoiseServer}
   */
  listen(opts, callback) {
    this._server.listen(opts, callback);
    return this;
  }

  /**
    Indicates whether or not the server is listening for connections.

    @returns {boolean}
   */
  get listening() {
    return this._server.listening;
  }

  /**
    Set this property to reject connections when the server's connection count gets high.

    @type number
   */
  get maxConnections() {
    return this._server.maxConnections;
  }

  set maxConnections(val) {
    this._server.maxConnections = val;
  }
}

module.exports = NoiseServer;
