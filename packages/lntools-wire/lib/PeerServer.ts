import { ILogger } from "@lntools/logger";
import { NoiseSocket } from "@lntools/noise";
import { NoiseServer } from "@lntools/noise/lib/noise-server";
import { EventEmitter } from "events";
import { InitMessage } from "./messages/init-message";
import { Peer } from "./Peer";

export class PeerServer extends EventEmitter {
  public localSecret: Buffer;
  public logger: ILogger;
  public initMessageFactory: () => InitMessage;
  public port: number;
  public host: string;

  protected _server: NoiseServer;

  constructor(
    host: string,
    port: number,
    localSecret: Buffer,
    initMessageFactory: () => InitMessage,
    logger: ILogger,
  ) {
    super();
    this.localSecret = localSecret;
    this.logger = logger;
    this.initMessageFactory = initMessageFactory;
    this.port = port;
    this.host = host;

    this._server = new NoiseServer({ ls: localSecret }, this._onSocket.bind(this));
    this._server.on("listening", () => this.emit("listening"));
  }

  /**
   * Starts the peer manager listening
   * @param host
   * @param port
   */
  public listen() {
    this._server.listen({ host: this.host, port: this.port });
  }

  /**
   * Shuts down the server
   */
  public shutdown() {
    this._server.close();
  }

  /**
   * Handles when a socket connects to us
   * @param socket
   */
  protected _onSocket(socket: NoiseSocket) {
    this.logger.info("peer connected");
    const peer = new Peer(this.localSecret, this.initMessageFactory, this.logger);
    peer.attach(socket);
    this.emit("peer", peer);
  }
}
