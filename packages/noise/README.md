# Lightning Network Noise Protocol Socket (BOLT #8)

[![CircleCI](https://circleci.com/gh/altangent/node-lightning/tree/master.svg?style=shield)](https://circleci.com/gh/altangent/node-lightning/tree/master)
[![codecov](https://codecov.io/gh/altangent/node-lightning/branch/master/graph/badge.svg)](https://codecov.io/gh/altangent/node-lightning)

Implements a Noise Protocol TCP Socket and Server in Node.js as defined in Lightning Network BOLT #8 for Encrypted and Authenticated Transport.

`NoiseSocket` enables confidentiality between two nodes by encrypting all traffic between them. All traffic is also authenticated against the node's known long-term identifier (Bitcoin public key as curve secp256k1).

`NoiseSocket` performs a cryptographic handshake upon connection and performs frequent key rotation. Once the handshake is complete, the `ready` event signals that messages can be sent or received.

`NoiseSocket` is a decorator for `net.Socket`. It maintains the same interface used by `net.Socket` and implements a `Duplex` stream. This enables reading from the stream in paused (`readable` event) or flowing mode (piped or `data` event).

Learn more about the Noise Protocol and the Lighting Network version:

-   [Noise Protocol](http://noiseprotocol.org/)
-   [Lightning Network BOLT #8](https://github.com/lightningnetwork/lightning-rfc/blob/master/08-transport.md)

## Requirements

-   Node.js 10.17+

## Usage

### Creating a NoiseSocket Client

This example shows how to create a `NoiseSocket` that connects to a `NoiseServer`.

To create a `NoiseSocket`, you must provide:

-   local private key `ls` which is a `Buffer` with 32-bytes
-   remote node's compressed public key `rp` which is a `Buffer` with 33-bytes.

These two values are required to create the encrypted and authenticated communication channel.

```javascript
const noise = require("@node-lightning/noise");

// ls is private key as a Buffer(32) defining a point on elliptic
// curve secp256k1
const ls = Buffer.from("1111111111111111111111111111111111111111111111111111111111111111", "hex");

// rpk is compressed public key as a Buffer(33) defining a point
// on elliptic curve secp256k1
const rpk = Buffer.from(
    "028d7500dd4c12685d1f568b4c2b5048e8534b873319f3a8daa612b469132ec7f7",
    "hex",
);

// Create a new `NoiseSocket` instance using the `connect` factory
const socket = noise.connect({ ls, rpk, host: "127.0.0.1", port: 9735 });

// Socket will emit the `connect` event when the TCP connection is
// established, however the socket is not yet ready because the
// handshake has not be completed
socket.on("connect", () => {
    console.log("connected to server");
});

// Socket will emit the `ready` event once the handshake is completed.
// The socket is now ready for sending and receiving messages!
socket.on("ready", () => {
    console.log("handshake complete, ready for sending/receiving");

    // Send a message
    socket.write(Buffer.from("hello from client"));
});

// Attaching a `data` event will put the socket into flowing mode and will
// process messages as soon as they arrive.
socket.on("data", buf => {
    console.log("received: " + buf.toString());
});
```

### Creating a NoiseSocket Server:

```javascript
const noise = require('@node-lightning/noise');

// ls is private key as a Buffer(32) defining a point on elliptic
// curve secp256k1
const ls = Buffer.from('2121212121212121212121212121212121212121212121212121212121212121', 'hex');

// Create a server bound to our local secret. New connections will be
// handled by the onSocket function.
const server = noise.createServer({ ls }, onSocket);

// Start the server listening on port 9735.
server.listen({ host: '127.0.0.1', port: 9735 });

// Handle when a remote socket connects to the server. The socket
// will be connected, but is not ready for use until the `ready`
// event is emitted. `socket` is an instance of `NoiseSocket`.
function onSocket(socket) {
  console.log('remote socket connected');

  // Socket will emit the `ready` event once the handshake is completed.
  // The socket is now ready for sending and receiving messages!
  socket.on('ready', () => {
    console.log('handshake complete, ready for sending/receiving');

    // Send a message
    socket.write(Buffer.from('hello from server'));
  });

  // Attaching a `data` event will put the socket into flowing mode and
  // will process messages as soon as they arrive.
  socket.on('data', buf => {
    console.log('received: ' + buf.toString());
  });
});
```

### Reading Modes

Because Noisesocket is a `Duplex` stream and fully implements `Readable` functionality, it allows reading from the stream via both reading modes: flowing and paused.

Flowing mode is the recommended technique for consuming data and can be achieved by using the `data` event or piping the NoiseSocket to another stream.

The `data` event method reads data as soon as it comes in:

```javascript
socket.on("data", buf => {
    /* do stuff with the buffer */
});
```

You can pipe responses to other streams:

```javascript
let fs = require("fs");
let wr = fs.createWriteStream("capture.bin");

// pipe the raw buffer data to some other stream
socket.pipe(wr);
```

Lastly, you can use paused mode to manually read from the stream. `readable` events will be emitted when new data is available. This mechanism allows you to directly control how reads occur and is useful
for implementing wire protocols ontop of the `NoiseSocket`.

```javascript
socket.on("readable", () => {
    let buf = socket.read();
    if (buf) {
        /* do stuff with the buffer */
    }
});
```

More information about reading modes is available in the Node.js [streams documentation](https://nodejs.org/api/stream.html#stream_two_reading_modes).

### Writing

Writing to the socket can be accomplished by calling `write` and passing in a Buffer.

```javascript
let d = Buffer.from("some data");
socket.write(d);
```

The `write` method will return a boolean value indicating if you can continue to write to the socket. If `write` returns false, you must wait until the `drain` event is emitted before continuing to write data. If you do not respond to to the boolean flag, data will be buffered into memory.
