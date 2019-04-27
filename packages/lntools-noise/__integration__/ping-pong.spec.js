const sinon = require('sinon');
const { expect } = require('chai');
const winston = require('winston');
const crypto = require('@lntools/crypto');
const noise = require('../lib');
/**
  This test creates a server and a client. Once the client has connected
  to the server, the server will send a message with the body "ping".

  Once the client recieves the "ping" message it will reply with a "pong"
  message.

  This test exercises key the complete connection / handshake process for both
  client and server and sending and receiving data using the "flowing"
  stream method by attaching to the "data" event.
 */
describe('ping-pong integration test', () => {
  let sandbox;

  before(() => {
    sandbox = sinon.createSandbox();
    sandbox.stub(winston);
  });

  it('should send 1001 messages back and forth without error', done => {
    let server = createServer(complete);
    let client = createClient(complete);

    // complete will be called when any of the above happens
    // 1. server has an error
    // 2. client has an error
    // 3. client has reached 1001 messages received
    function complete(err) {
      server.close();
      client.end();
      done(err);
    }
  });
});

function createServer(done) {
  let ls = Buffer.from('2121212121212121212121212121212121212121212121212121212121212121', 'hex'); // prettier-ignore
  let esFactory = () => Buffer.from('2222222222222222222222222222222222222222222222222222222222222222', 'hex'); // prettier-ignore

  // create a server
  let server = noise.createServer({ ls, esFactory }, socket => {
    // send first message on connect
    socket.on('connect', () => {
      socket.write(Buffer.from('ping'));
    });

    socket.on('data', data => {
      // verify a pong message was sent
      expect(data.toString()).to.equal('pong');

      // immediately reply with a pong
      socket.write(Buffer.from('ping'));
    });

    socket.on('error', done);
  });

  server.listen({ port: 10000, host: '127.0.0.1' });

  return server;
}

function createClient(done) {
  let ls = Buffer.from('1111111111111111111111111111111111111111111111111111111111111111', 'hex'); // prettier-ignore
  let rs = crypto.getPublicKey(Buffer.from('2121212121212121212121212121212121212121212121212121212121212121', 'hex')); // prettier-ignore
  let es = Buffer.from('1212121212121212121212121212121212121212121212121212121212121212', 'hex'); // prettier-ignore
  let count = 0;

  let socket = noise.connect({ ls, rs, es, host: '127.0.0.1', port: 10000 });

  socket.on('data', data => {
    if (count > 1000) return; // received reply to last message and socket hasn't closed yet

    // expect ping
    expect(data.toString()).to.equal('ping');

    // send pong
    socket.write(Buffer.from('pong'));
    count++;

    // close things down if we've sent more than 1000 messages
    if (count > 1000) done();
  });

  socket.on('error', done);

  return socket;
}
