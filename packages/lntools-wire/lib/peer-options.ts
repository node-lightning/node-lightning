import { ILogger } from "@lntools/logger";
import { InitMessage } from "./messages/init-message";

export type PeerOptions = {
  /**
   * Local secret, 32-byte Buffer
   */
  ls: Buffer;

  /**
   * Remote public key, 33-byte compressed public key
   */
  rpk: Buffer;

  /**
   * Host, defaults to localhost
   */
  host?: string;

  /**
   * Port, defaults to 9735
   */
  port?: number;

  /**
   * Factory method for creating an init message
   */
  initMessageFactory: () => InitMessage;

  /**
   * Logger
   */
  logger: ILogger;
};
