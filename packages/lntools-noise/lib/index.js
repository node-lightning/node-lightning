// @ts-check

const { Socket } = require('net');
const NoiseServer = require('./noise-server');
const NoiseSocket = require('./noise-socket');
const NoiseState = require('./noise-state');
const crypto = require('@lntools/crypto');

module.exports = {
  NoiseState: require('./noise-state'),
  NoiseSocket: require('./noise-socket'),
  connect,
  createServer,
};

/**
  Connect to a remote noise socket server.

  @param {Object} opts
  @param {Buffer} opts.ls local secret as a 32-byte secp256k1
  private key
  @param {Buffer} [opts.es] optional ephemeral private key,
  @param {Buffer} opts.rpk remote compressed public key, 33-bytes
  32-byte secp256k1 private key. If not provided, one is generated.
  @param {string} [opts.host] optional host. Defaults to localhost.
  @param {number} [opts.port] optional port. Defaults to 9735.
  @returns {NoiseSocket}
 */
function connect({ ls, es, rpk, host, port = 9735 }) {
  if (!es) {
    es = crypto.createPrivateKey();
  }
  let noiseState = new NoiseState({ ls, es });
  let socket = new Socket();
  let instance = new NoiseSocket({ socket, noiseState, rpk });
  socket.connect({ host, port });
  return instance;
}

/**
  Factory function to create a new server
  @param {Object} opts
  @param {Buffer} opts.ls local secret as a 32-byte secp256k1 private key
  @param {() => Buffer} [opts.esFactory] optional
    function used to create an ephemeral key for each new connection that arrives. Default
    will use the built-in key generation method
  @param {(socket: NoiseSocket) => void} connListener listener called when `connection` event is
    emitted. Shorthand for `server.on('connection', connListener);`
  @returns {NoiseServer} new instance ready for listening
 */
function createServer({ ls, esFactory }, connListener) {
  return new NoiseServer({ ls, esFactory }, connListener);
}
