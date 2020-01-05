import { Logger } from "@lntools/logger";

export type NoiseStateOptions = {
  /**
   * Local private key as a 32-byte buffer
   */
  ls: Buffer;

  /**
   * Ephemeral private key as a 32-byte
   */
  es: Buffer;

  /**
   * Logger to use for NoiseState
   */
  logger?: Logger;
};
