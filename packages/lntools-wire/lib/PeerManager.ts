import { ILogger } from "@lntools/logger";
import { NoiseSocket } from "@lntools/noise";
import { NoiseServer } from "@lntools/noise/lib/noise-server";
import { InitMessage } from "./messages/init-message";
import { Peer } from "./Peer";

export class PeerManager {
  public localSecret: Buffer;
  public logger: ILogger;
  public initMessageFactory: () => InitMessage;
  public port: number;
  public host: string;

  protected _server: NoiseServer;
  protected _peers: Map<string, Peer>;

  constructor(
    host: string,
    port: number,
    localSecret: Buffer,
    initMessageFactory: () => InitMessage,
    logger: ILogger,
  ) {
    this.localSecret = localSecret;
    this.logger = logger;
    this.initMessageFactory = initMessageFactory;
    this.port = port;
    this.host = host;

    this._peers = new Map();
    this._server = new NoiseServer({ ls: localSecret }, this._onSocket.bind(this));
    this._server.listen({ port, host: "0.0.0.0" });
  }

  /**
   * Handles when a socket connects to us
   * @param socket
   */
  protected _onSocket(socket: NoiseSocket) {
    this.logger.info("peer connected");
    const peer = new Peer(this.localSecret, socket.rpk, this.initMessageFactory, this.logger);
    peer.attach(socket);
    this._peers.set(peer.pubkeyHex, peer);
  }
}
