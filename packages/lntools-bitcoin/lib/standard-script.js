// import OPS from 'bitcoin-ops';
// import { compileScript } from './script';

// // Refer to:
// // https://github.com/bitcoinjs/bitcoinjs-lib/blob/master/src/payments/p2pkh.js#L58
// export function p2pkhScript(hash160PubKey: Buffer) {
//   // prettier-ignore
//   return compileScript([
//     OPS.OP_DUP,
//     OPS.OP_HASH160,
//     hash160PubKey,
//     OPS.OP_EQUALVERIFY,
//     OPS.OP_CHECKSIG
//   ]);
// }

// export function p2shScript(hash160Script: Buffer) {
//   // prettier-ignore
//   return compileScript([
//     OPS.OP_HASH160,
//     hash160Script,
//     OPS.OP_EQUAL
//   ]);
// }

// // Refer to: https://github.com/bitcoinjs/bitcoinjs-lib/blob/master/src/payments/p2ms.js#L58
// export function p2msScript(m: number, n: number, pubkeys: Array<Buffer>) {
//   // prettier-ignore
//   return compileScript([
//     80 + m,
//     ...pubkeys,
//     80 + n,
//     OPS.OP_CHECKMULTISIG,
//   ]);
// }

// // Refer to: https://github.com/bitcoinjs/bitcoinjs-lib/blob/master/src/payments/p2wpkh.js#L65
// function p2wpkhScript(hash160PubKey) {
//   // prettier-ignore
//   return compileScript([
//     OPS.OP_0,
//     hash160PubKey,
//   ]);
// }
