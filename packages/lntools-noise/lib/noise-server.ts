import * as crypto from "@lntools/crypto";
import assert from "assert";
import { EventEmitter } from "events";
import { Server, Socket } from "net";
import { NoiseError } from "./noise-error";
import { NoiseServerListenOptions } from "./noise-server-listen-options";
import { NoiseServerOptions } from "./noise-server-options";
import { NoiseSocket } from "./noise-socket";
import { NoiseState } from "./noise-state";

export class NoiseServer extends EventEmitter {
  /**
   * Local private key as a 32-byte private key for elliptic curve
   * secp256k1 used by the server
   */
  public ls: Buffer;

  /**
   * Function for creating the ephemeral private key used by each
   * connection
   */
  public esFactory: () => Buffer;

  /**
   * Socket server that is created
   */
  private _server: Server;

  /**
   * NoiseServer is a TCP server that wraps socket instances
   * with the NoiseSocket class. This class is an event emitter
   * with the same interface as net.Server.
   *
   * The constructor take arguments that will be used by the
   * NoiseState.
   */
  constructor(opts: NoiseServerOptions, connListener?: (socket: NoiseSocket) => void) {
    super();

    // localSecret assertions
    assert.ok(Buffer.isBuffer(opts.ls), new NoiseError("ls must be a buffer"));
    assert.ok(crypto.validPrivateKey(opts.ls), new NoiseError("ls must be valid public key"));
    this.ls = opts.ls;

    // ephemeral secret factory
    assert.ok(
      !opts.esFactory || typeof opts.esFactory === "function",
      new NoiseError("esFactory must be a function"),
    );
    this.esFactory = opts.esFactory || crypto.createPrivateKey;

    // construct and bind the server
    this._server = new Server();
    this._server.on("connection", this._onConnection.bind(this));
    this._server.on("error", err => this.emit("error", err));
    this._server.on("close", () => this.emit("close"));
    this._server.on("listening", () => this.emit("listening"));

    if (connListener) this.on("connection", connListener);
  }

  /**
   * Called when the socket receives a new socket connection.
   * Emits the `connection` event.
   */
  public _onConnection(socket: Socket) {
    const ls = this.ls;
    const es = this.esFactory();
    const noiseState = new NoiseState({ ls, es });
    const noiseSocket = new NoiseSocket({ socket, noiseState });
    this.emit("connection", noiseSocket);
  }

  /**
   * Returns the address the server is listeening on. If the server is
   * not listening, it will return undefined.
   */
  public address() {
    return this._server.address();
  }

  /**
   * Stops the server from accepting new connections and keeps existing connections open.
   * This function is asynchronous, the server is fully closed when all connections are
   * ended and the server emits a `close` event. The optional `cb` event will be called
   * once the `close` event occurs.
   */
  public close(cb?: (err?: Error) => void) {
    this._server.close(cb);
  }

  /**
   * Asynchronously get the number of concurrent connections on the server. Works when sockets were sent to forks.
   */
  public getConnections(cb: (error: Error, count: number) => void) {
    this._server.getConnections(cb);
  }

  /**
   * Start a server listening for connections. This method is asyncrhonous,
   * once the server has started listening, the `listening` event will be
   * emitted.
   * @param callback Called when the server is listening. Automatically binds
   * the function to the `listening` event.
   */
  public listen(opts: NoiseServerListenOptions, callback?: () => void) {
    this._server.listen(opts, callback);
    return this;
  }

  /**
   * Indicates whether or not the server is listening for connections.
   */
  get listening() {
    return this._server.listening;
  }

  /**
   * Set this property to reject connections when the server's connection count gets high.
   */
  get maxConnections() {
    return this._server.maxConnections;
  }

  set maxConnections(val) {
    this._server.maxConnections = val;
  }
}
