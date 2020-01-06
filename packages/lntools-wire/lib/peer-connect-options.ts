export type PeerConnectOptions = {
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
};
