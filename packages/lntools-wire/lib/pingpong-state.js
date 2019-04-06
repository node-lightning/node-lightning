const PingMessage = require('./ping-message');
const PongMessage = require('./pong-message');

/**
 * Maintains ping/pong state for a client where by it will perform several functions. Refer to
 * Bolt01 for all nuances of implementation.
 *
 * 0. Upon receipt of a message from the remote server, we reset the ping timeout as
 *    we are aware that the server is still live.
 *
 * 1. When there are no messages from a client for a period of time, it will emit a ping
 *    and wait for the pong.  If not pong is received, or the pong is invalid, then the
 *    connection is terminated.
 *
 * 2. When a ping is received an appropriate pong message will be sent. If pong messages
 *    are received more frequently than 30 second, then they are ignored. If more than
 *    5 pings are receiced in a 30 second period, then we will close the connection.
 */
class PingPongState {
  constructor(peerClient) {
    this._peerClient = peerClient;
    this._lastMessageReceived = undefined;
    this._pingsReceieved = 0;
    this.PING_INTERVAL_MS = 60000;
    this.PONG_TIMEOUT_MS = 15000;
    this.PING_FLOOD_THRESHOLD = 10;
    this.PONG_REQUIRED_THRESHOLD = 65532;
  }
  /**
   * Starts the PingPongState manager by starting a ping interval that will
   * consider sending a ping every 60s
   */
  start() {
    this._sendPingIntervalHandle = setInterval(
      this._onSendPingInterval.bind(this),
      this.PING_INTERVAL_MS
    );
  }

  /**
   * Handles incoming messages
   */
  onMessage(m) {
    // update the time of the last received message
    this._lastMessageReceived = Date.now();

    // received ping
    if (m.type === 18) {
      this._pingsReceieved += 1;
      this._checkForPingFlood();

      // only send pong when num_pong_bytes as per spec
      if (m.numPongBytes < this.PONG_REQUIRED_THRESHOLD) this._sendPong(m);
    }

    // recieved pong
    if (m.type === 19) {
      this._validatePong(m);
    }
  }

  /**
   * Fires prior to the peer being disconnected
   * and will clean up resources
   */
  onDisconnecting() {
    clearTimeout(this._pongTimeoutHandle);
    clearInterval(this._sendPingIntervalHandle);
  }

  ///////////

  _sendPing() {
    // clear existing pong timeout handle in case we have yet to receive a pong
    clearTimeout(this._pongTimeoutHandle);

    // create the timeout we will wait for the pong
    this._pongTimeoutHandle = setTimeout(this._pongTimedOut.bind(this), this.PONG_TIMEOUT_MS);

    // create and send the ping
    let ping = new PingMessage();
    this._peerClient.sendMessage(ping);

    // capture this so we can validate it
    this._sentPing = ping;
  }

  _sendPong(ping) {
    // construct and send a message
    let pong = new PongMessage(ping.numPongBytes);
    this._peerClient.sendMessage(pong);
  }

  _onSendPingInterval() {
    // reset the number of pings received
    this._pingsReceieved = 0;

    // if message has been received within a minute, then do not send a ping
    if (
      !this._lastMessageReceived ||
      Date.now() - this._lastMessageReceived > this.PING_INTERVAL_MS
    )
      this._sendPing();
  }

  _validatePong(pong) {
    // clear the pong timeout
    clearTimeout(this._pongTimeoutHandle);

    // check that pong is a valid one and if not, we disconnect
    if (this._sentPing && this._sentPing.numPongBytes !== pong.ignored.length) {
      this._peerClient.disconnect();
      return;
    }
  }

  _pongTimedOut() {
    this._peerClient.disconnect();
  }

  _checkForPingFlood() {
    if (this._pingsReceieved > this.PING_FLOOD_THRESHOLD) {
      this._peerClient.disconnect();
    }
  }
}

module.exports = PingPongState;
