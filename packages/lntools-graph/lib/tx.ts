import { p2msScript } from "@lntools/bitcoin/lib/script/p2ms-script";
import { p2wshScript } from "@lntools/bitcoin/lib/script/p2wsh-script";
import { sha256 } from "@lntools/crypto";

export function fundingScript(pubkeys: Buffer[]) {
  const lower = lesser(pubkeys[0], pubkeys[1]);
  let node1: Buffer;
  let node2: Buffer;
  if (lower === -1) {
    node1 = pubkeys[0];
    node2 = pubkeys[1];
  } else {
    node1 = pubkeys[1];
    node2 = pubkeys[0];
  }

  const script = p2msScript(2, 2, [node1, node2]);
  const hash = sha256(script);
  return p2wshScript(hash);
}

function lesser(a: Buffer, b: Buffer) {
  for (let i = 0; i < a.length; i++) {
    if (a[i] < b[i]) return -1;
    if (a[i] > b[i]) return 1;
  }
  return 0;
}
