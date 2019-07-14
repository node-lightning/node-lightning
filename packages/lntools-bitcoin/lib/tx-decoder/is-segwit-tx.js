// @ts-check

exports.isSegWitTx = isSegWitTx;

/**
  Returns true is the raw transaction is a SegWit transition.
  This method works by reading the 5th and 6th bits. SegWit
  transitions have a 0x0001 as the flag for SegWit transactions.
  We can guarantee this because the next value is the tx_in
  count and can never be 0.

  @param {Buffer} raw
  @returns {boolean}
 */
function isSegWitTx(raw) {
  return raw[4] === 0x00 && raw[5] === 0x01;
}
