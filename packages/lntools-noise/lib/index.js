const { Socket } = require('net');
const NoiseServer = require('./noise-server');
const NoiseSocket = require('./noise-socket');
const NoiseState = require('./noise-state');
const crypto = require('@lntools/crypto');

module.exports = {
  NoiseState: require('./noise-state'),
  connect,
  createServer,
};

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

function createServer({ localSecret, ephemeralSecretFactory } = {}, connListener) {
  return new NoiseServer({ localSecret, ephemeralSecretFactory }, connListener);
}
