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
  @param {import('@lntools/crypto/lib/key').ECKey} opts.localSecret local key used by the client
  @param {import('@lntools/crypto/lib/key').ECKey} opts.remoteSecret remote public key used by
  remote server
  @param {import('@lntools/crypto/lib/key').ECKey} [opts.ephemeralSecret] optional ephemeral
  key used for the connection. If not provided, one is generated.
  @param {string} [opts.host] optional host. Defaults to localhost.
  @param {number} [opts.port] optional port. Defaults to 9735.
  @returns {NoiseSocket}
 */
function connect({ localSecret, remoteSecret, ephemeralSecret, host, port = 9735 }) {
  if (!ephemeralSecret) {
    ephemeralSecret = crypto.generateRandomKey();
  }
  let noiseState = new NoiseState({ ls: localSecret, rs: remoteSecret, es: ephemeralSecret });
  let socket = new Socket();
  let instance = new NoiseSocket({ socket, noiseState, initiator: true });
  socket.connect({ host, port });
  return instance;
}

/**
  Factory function to create a new server
  @param {Object} opts
  @param {import('@lntools/crypto/lib/key').ECKey} localSecret local key for the server
  @param {() => import('@lntools/crypto/lib/key').ECKey} [ephemeralSecretFactory] optional
    function used to create an ephemeral key for each new connection that arrives. Default
    will use the built-in key generation method
  @param {(socket: NoiseSocket) => void} connListener listener called when `connection` event is
    emitted. Shorthand for `server.on('connection', connListener);`
  @returns {NoiseServer} new instance ready for listening
 */
function createServer({ localSecret, ephemeralSecretFactory }, connListener) {
  return new NoiseServer({ localSecret, ephemeralSecretFactory }, connListener);
}
