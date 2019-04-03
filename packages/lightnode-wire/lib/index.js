const { Socket } = require('net');
const NoiseSocket = require('./noise-socket');
const NoiseState = require('./noise-state');
const crypto = require('@lightnode/crypto');

module.exports = {
  NoiseStart: require('./noise-state'),
  PeerClient: require('./peer-client'),
  PingPongState: require('./pingpong-state'),
  connect,
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
