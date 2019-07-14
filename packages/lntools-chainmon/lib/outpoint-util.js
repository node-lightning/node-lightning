exports.outpointKey = outpointKey;

/**
 * Generates a key from an outpoint
 * @param {{txId: Buffer, output: number}} outpoint
 */
function outpointKey(outpoint) {
  return `${outpoint.txId.toString('hex')}:${outpoint.output}`;
}
