import * as crypto from "@lntools/crypto";
import { ILogger } from "@lntools/logger";
import { Socket } from "net";
import { NoiseServer } from "./noise-server";
import { NoiseServerOptions } from "./noise-server-options";
import { NoiseSocket } from "./noise-socket";
import { NoiseState } from "./noise-state";

export { NoiseError } from "./noise-error";
export { NoiseServer } from "./noise-server";
export { NoiseServerOptions } from "./noise-server-options";
export { NoiseServerListenOptions } from "./noise-server-listen-options";
export { NoiseSocket } from "./noise-socket";
export { NoiseSocketOptions } from "./noise-socket-options";
export { NoiseState } from "./noise-state";

export type NoiseConnectOptions = {
  /**
   * Local secret as a 32-byte secp256k1 private key
   */
  ls: Buffer;

  /**
   * Optional ephemeral 32-byte secp256k1 private key. If not provided, one is generated.
   */
  es?: Buffer;

  /**
   * remote compressed public key, 33-bytes.
   */
  rpk: Buffer;

  /**
   * Optional host. Defaults to localhost.
   */
  host?: string;

  /**
   * Optional port. Defaults to 9735.
   */
  port?: number;

  /**
   * Optional logger
   */
  logger?: ILogger;
};

/**
 * Connect to a remote noise socket server.
 */
export function connect({ ls, es, rpk, host, port = 9735, logger }: NoiseConnectOptions) {
  if (!es) {
    es = crypto.createPrivateKey();
  }

  const noiseLogger = logger ? logger.sub("noise", rpk.slice(0, 8).toString("hex")) : undefined;
  const noiseState = new NoiseState({ ls, es, logger: noiseLogger });
  const socket = new Socket();
  const instance = new NoiseSocket({ socket, noiseState, rpk, logger: noiseLogger });
  socket.connect({ host, port });
  return instance;
}

/**
 * Factory function to create a new server
 */
export function createServer(
  { ls, esFactory }: NoiseServerOptions,
  connListener: (socket: NoiseSocket) => void,
) {
  return new NoiseServer({ ls, esFactory }, connListener);
}
