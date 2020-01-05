export type NoiseServerOptions = {
  /**
   * Local private key as a 32-byte private key for elliptic curve
   * secp256k1 used by the server
   */
  ls: Buffer;

  /**
   * Function for creating the ephemeral private key used by each
   * connection
   */
  esFactory?: () => Buffer;
};
