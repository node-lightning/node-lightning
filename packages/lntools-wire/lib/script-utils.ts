import { BufferCursor } from "@lntools/buffer-cursor";
import { sha256 } from "@lntools/crypto";

const OP_0 = 0;
const OP_CHECKMULTISIG = 174;

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

function compileScript(chunks: Array<Buffer | number>): Buffer {
  let bufferSize = 0;
  for (const chunk of chunks) {
    if (Buffer.isBuffer(chunk)) {
      bufferSize += 1; // length
      bufferSize += chunk.length; // chunk length < 76 bytes
    } else {
      bufferSize += 1; // opcode
    }
  }

  const buffer = Buffer.alloc(bufferSize);
  const writer = new BufferCursor(buffer);

  for (const chunk of chunks) {
    if (Buffer.isBuffer(chunk)) {
      writer.writeUInt8(chunk.length); // chunk length < 76 bytes
      writer.writeBytes(chunk);
    } else {
      writer.writeUInt8(chunk);
    }
  }
  return buffer;
}

function p2msScript(m: number, n: number, pubkeys: Buffer[]): Buffer {
  return compileScript([
    80 + m,
    ...pubkeys,
    80 + n,
    OP_CHECKMULTISIG,
  ]); // prettier-ignore
}

function p2wshScript(hash160Script: Buffer): Buffer {
  return compileScript([
    OP_0,
    hash160Script,
  ]); // prettier-ignore
}
