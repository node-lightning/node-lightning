import { LogManager, manager } from "@lntools/logger";
import * as noise from "@lntools/noise";
import assert from "assert";
import { EventEmitter } from "events";
import * as MessageFactory from "./message-factory";
import { InitMessage } from "./messages/init-message";
import { PeerConnectOptions } from "./peer-connect-options";
import { PeerState } from "./peer-state";
import { PingPongState } from "./pingpong-state";

/**
 * Peer is an EventEmitter that layers the Lightning Network wire
 * protocol ontop of an @lntools/noise NoiseSocket.
 *
 * Peer itself is a state-machine with three states:
 * 1. pending
 * 2. awaiting_peer_init
 * 3. ready
 *
 * The Peer instance starts in `pending` until the underlying NoiseSocket
 * has connected.
 *
 * It then immediately sends the InitMessage as specified in the Peer
 * constructor.
 *
 * At this point, the Peer transitions to `awaiting_peer_init`.
 *
 * Once the remote peer has sent its InitMessage, the state is
 * transitioned to `ready` and the Peer can be begin sending and
 * receiving messages.
 *
 * Once the peer is in the `ready` state it will begin emitting `message`
 * events when it receives new messages from the peer.
 *
 * The Peer will also start a PingPong state machine to manage sending
 * and receiving Pings and Pongs as defined in BOLT01
 *
 * A choice (probably wrongly) was made to make Peer an EventEmitter
 * instead of a DuplexStream operating in object mode. We need to keep
 * the noise socket in flowing mode (instead of paused) because we will
 * not know the length of messages until after we have deserialized the
 * message. This makes it a challenge to implement a DuplexStream that
 * emits objects (such as messages).
 *
 * @emits ready the underlying socket has performed its handshake and
 * initialization message swap has occurred.
 *
 * @emits message a new message has been received. Only sent after the
 * `ready` event has fired.
 *
 * @emits rawmessage outputs the message as a raw buffer instead of
 * a deserialized message.
 *
 * @emits error emitted when there is an error processing a message.
 * The underlying socket will be closed after this event is emitted.
 *
 * @emits close emitted when the connection to the peer has completedly
 * closed.
 *
 * @emits end emitted when the connection to the peer is ending.
 */
export class Peer extends EventEmitter {
  public static states = PeerState;

  public state: PeerState = PeerState.pending;
  public socket: any;
  public messageCounter: number = 0;
  public initRoutingSync: boolean = false;
  public pingPongState: PingPongState;
  public logger: LogManager;
  public remoteInit: any;

  constructor() {
    super();
    this.pingPongState = new PingPongState(this);
  }

  /**
   * Connect to the remote peer and binds socket events into the Peer.
   */
  public connect({ ls, rpk, host, port = 9735 }: PeerConnectOptions) {
    // construct a logger before connecting
    this.logger = manager.create("PEER", rpk && rpk.toString("hex"));

    this.socket = noise.connect({ ls, rpk, host, port });
    this.socket.on("ready", this._onSocketReady.bind(this));
    this.socket.on("end", this._onSocketEnd.bind(this));
    this.socket.on("close", this._onSocketClose.bind(this));
    this.socket.on("error", this._onSocketError.bind(this));
    this.socket.on("data", this._onSocketData.bind(this));
  }

  /**
   * Writes the message on the NoiseSocket
   */
  public sendMessage(m: any): boolean {
    assert.ok(this.state === PeerState.ready, new Error("Peer is not ready"));
    m = m.serialize();
    return this.socket.write(m);
  }

  /**
   * Closes the socket
   */
  public disconnect() {
    this.socket.end();
  }

  /////////////////////////////////////////////////////////

  private _onSocketReady() {
    // now that we're connected, we need to wait for the remote reply
    // before any other messages can be receieved or sent
    this.state = PeerState.awaiting_peer_init;

    // blast off our init message
    this._sendInitMessage();
  }

  private _onSocketEnd() {
    this.emit("end");
  }

  private _onSocketClose() {
    if (this.pingPongState) this.pingPongState.onDisconnecting();
    this.emit("close");
  }

  private _onSocketError(err) {
    // emit what error we recieved
    this.emit("error", err);
  }

  private _onSocketData(raw) {
    try {
      if (this.state === PeerState.awaiting_peer_init) {
        this._processPeerInitMessage(raw);
      } else {
        this._processMessage(raw);
      }
    } catch (err) {
      // we have a problem, kill connectinon with the client
      this.socket.end();

      // emit the error event
      this.emit("error", err);
    }
  }

  /**
   * Sends the initialization message to the peer.
   */
  private _sendInitMessage() {
    // construct the init message
    const initMessage = new InitMessage();

    // set initialization messages
    // initMessage.localInitialRoutingSync = this.initRoutingSync;
    initMessage.localDataLossProtect = true;
    initMessage.localGossipQueries = true;

    // fire off the init message
    const m = initMessage.serialize();
    this.socket.write(m);
  }

  /**
   * Processes the initialization message sent by the remote peer.
   * Once this is successfully completed, the state is transitioned
   * to `active`
   */
  private _processPeerInitMessage(raw: Buffer) {
    // deserialize message
    const m = MessageFactory.deserialize(raw) as InitMessage;
    if (this.logger) {
      this.logger.info(
        "peer initialized",
        `init_routing_sync: ${m.localInitialRoutingSync}`,
        `data_loss_protection: ${m.localDataLossProtect}`,
        `gossip_queries: ${m.localGossipQueries}`,
        `upfront_shutdown_script: ${m.localUpfrontShutdownScript}`,
      );
    }

    // ensure we got an InitMessagee
    assert.ok(m instanceof InitMessage, new Error("Expecting InitMessage"));

    // store the init messagee in case we need to refer to it
    this.remoteInit = m;

    // start other state now that peer is initialized
    this.pingPongState.start();

    // transition state to ready
    this.state = PeerState.ready;

    // emit ready event
    this.emit("ready");
  }

  /**
   * Process the raw message sent by the peer. These messages are
   * processed after the initialization message has been received.
   */
  private _processMessage(raw: Buffer) {
    // deserialize the message
    const m = MessageFactory.deserialize(raw);

    // ensure pingpong state is updated
    if (m) {
      this.pingPongState.onMessage(m);

      // emit the message
      this.emit("rawmessage", raw);
      this.emit("message", m);
    }
  }
}
