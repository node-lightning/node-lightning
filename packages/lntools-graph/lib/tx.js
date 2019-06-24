// @ts-check

const { sha256 } = require('@lntools/crypto');
const { p2wshScript } = require('@lntools/bitcoin/lib/script/p2wsh-script');
const { p2msScript } = require('@lntools/bitcoin/lib/script/p2ms-script');

exports.fundingScript = fundingScript;

function fundingScript(pubkeys) {
  let lower = lesser(pubkeys[0], pubkeys[1]);
  let node1, node2;
  if (lower === -1) {
    node1 = pubkeys[0];
    node2 = pubkeys[1];
  } else {
    node1 = pubkeys[1];
    node2 = pubkeys[0];
  }

  let script = p2msScript(2, 2, [node1, node2]);
  let hash = sha256(script);
  return p2wshScript(hash);
}

function lesser(a, b) {
  for (let i = 0; i < a.length; i++) {
    if (a[i] < b[i]) return -1;
    if (a[i] > b[i]) return 1;
  }
  return 0;
}
