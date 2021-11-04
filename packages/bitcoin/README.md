# @node-lightning/bitcoin

This package provides common Bitcoin functionality and does not rely on third party libraries.

## Basic Keys

### PrivateKey

The `PrivateKey` type encapsulates a 32-byte buffer that represents a private key
in the secp256k1 elliptic curve used by Bitcoin. The key corresponds to
a network which allows for proper encoding/decoding of keys in various
formats. This class also includes methods for key tweaks, serialization
to/from WIF, and creation of its public key.

```typescript
import { PrivateKey } from "@node-lightning/bitcoin";

const buf = Buffer.alloc(32, 0x01);
const key = new PrivateKey(buf, Network.mainnet);

// converts to a buffer
// 0101010101010101010101010101010101010101010101010101010101010101
key.toBuffer();

// converts to a hex string
// 0101010101010101010101010101010101010101010101010101010101010101
key.toHex();

// converts to WIF uncompressed
// 5HpjE2Hs7vjU4SN3YyPQCdhzCu92WoEeuE6PWNuiPyTu3ESGnzn
key.toWif(false);
```

A private key supports add and multiply tweaks

```typescript
import { PrivateKey } from "@node-lightning/bitcoin";

const buf = Buffer.alloc(32, 0x01);
const key = new PrivateKey(buf, Network.mainnet);
const tweak2 = Buffer.from(
    "0000000000000000000000000000000000000000000000000000000000000002",
    "hex",
);

// additive tweak generates a new PrivateKey instance
// 0101010101010101010101010101010101010101010101010101010101010103
const addkey = key.tweakAdd(tweak2);

// multiplicative tweak generates a new PrivateKey instance
// 0202020202020202020202020202020202020202020202020202020202020202
const mulkey = key.tweakMul(tweak2);
```

A private key can be encoded into WIF:

```typescript
// encode to WIF
const buf = Buffer.alloc(32, 0x01);
const key = new PrivateKey(buf, Network.mainnet);

// Can encode compressed or uncompressed based on the parameter
// KwFfNUhSDaASSAwtG7ssQM1uVX8RgX5GHWnnLfhfiQDigjioWXHH
key.toWIF(true);

// converts to WIF uncompressed
// 5HpjE2Hs7vjU4SN3YyPQCdhzCu92WoEeuE6PWNuiPyTu3ESGnzn
key.toWif(false);
```

A private key can be decoded from WIF and it will include the PublicKey
in either compressed or uncompressed format.

```typescript
const [privateKey, publicKey] = PrivateKey.fromWif(
    "KwFfNUhSDaASSAwtG7ssQM1uVX8RgX5GHWnnLfhfiQDigjioWXHH",
);
```

A private key can be converted to a public key in either compressed or
uncompressed format:

```typescript
const buf = Buffer.alloc(32, 0x01);
const privateKey = new PrivateKey(buf, Network.mainnet);

// compressed public key
// 031b84c5567b126440995d3ed5aaba0565d71e1834604819ff9c17f5e9d5dd078f
const compressed = privateKey.toPubKey(true);

// uncompresed public key
// 041b84c5567b126440995d3ed5aaba0565d71e1834604819ff9c17f5e9d5dd078f70beaf8f588b541507fed6a642c5ab42dfdf8120a7f639de5122d47a69a8e8d1
const uncompressed = privateKey.toPubKey(false);
```

### Public Key

The `PublicKey` type encapsulates the public key point on an secp256k1
elliptic curve. The type includes both the network it corresponds to.

Constructed from a compressed 33-byte SEC encoded buffer:

```typescript
import { PublicKey } from "@node-lightning/bitcoin";

const buffer = Buffer.from(
    "031b84c5567b126440995d3ed5aaba0565d71e1834604819ff9c17f5e9d5dd078f",
    "hex",
);
let publicKey = new PublicKey(buffer, Network.mainnet);

// outputs a 33-byte buffer
// 031b84c5567b126440995d3ed5aaba0565d71e1834604819ff9c17f5e9d5dd078f
publicKey.toBuffer();

// outputs the hex string
// 031b84c5567b126440995d3ed5aaba0565d71e1834604819ff9c17f5e9d5dd078f
publicKey.toHex();

// hash160 of the compressed public key
// 79b000887626b294a914501a4cd226b58b235983
publicKey.hash160();

// convert to an uncompressed public key, which is a 65-byte version
publicKey = publicKey.toPubKey(false);

// outputs a 65-byte buffer
// 041b84c5567b126440995d3ed5aaba0565d71e1834604819ff9c17f5e9d5dd078f70beaf8f588b541507fed6a642c5ab42dfdf8120a7f639de5122d47a69a8e8d1
publicKey.toBuffer();

// outputs the hex string
// 041b84c5567b126440995d3ed5aaba0565d71e1834604819ff9c17f5e9d5dd078f70beaf8f588b541507fed6a642c5ab42dfdf8120a7f639de5122d47a69a8e8d1
publicKey.toHex();

// hash160 of the uncompressed public key
// 6ff3443c994fb2c821969dae53bd5b5052d8394f
publicKey.hash160();
```

You can output the P2PKH, P2SH-P2WPKH, and P2WPKH addresses of a public
key:

```typescript
import { PublicKey } from "@node-lightning/bitcoin";

const buffer = Buffer.from(
    "031b84c5567b126440995d3ed5aaba0565d71e1834604819ff9c17f5e9d5dd078f",
    "hex",
);
const publicKey = new PublicKey(buffer, Network.mainnet);

// output base58 encoded p2pkh address
// 1C6Rc3w25VHud3dLDamutaqfKWqhrLRTaD
publicKey.toP2pkhAddress();

// output base58 encoded p2sh-p2wpkh address
// 35LM1A29K95ADiQ8rJ9uEfVZCKffZE4D9i
publickey.toP2nwpkhAddress();

// output bech32 encoded p2wpkh address
// bc1q0xcqpzrky6eff2g52qdye53xkk9jxkvrh6yhyw
publickey.toP2wpkhAddress();
```

A public key can be tweaked by adding the point to a value multiplied by
the generator point to obtain a new point. The formula is
`T = P + tweak * G`. This returns a new instance with the same
compressed/uncompressed value as the original public key.

```typescript
import { PublicKey } from "@node-lightning/bitcoin";

const buffer = Buffer.from(
    "031b84c5567b126440995d3ed5aaba0565d71e1834604819ff9c17f5e9d5dd078f",
    "hex",
);
const publicKey = new PublicKey(buffer, Network.mainnet);

const tweak2 = Buffer.from(
    "0000000000000000000000000000000000000000000000000000000000000002",
    "hex",
);

// tweaks the public key by doing `T = point + tweak * G`
// 03a4fbd2c1822592c0ae8afa0e63a0d4c56a571179e93fd61615627f419fd0be9a
const newPubKey = publicKey.tweakAdd(tweak2);
```

A public key can be tweaked by multiplying the point by a scalar value.
The formula is `T = P * t`. This returns a new instance with the same
compressed/uncompressed value as the original public key.

```typescript
import { PublicKey } from "@node-lightning/bitcoin";

const buffer = Buffer.from(
    "031b84c5567b126440995d3ed5aaba0565d71e1834604819ff9c17f5e9d5dd078f",
    "hex",
);
const publicKey = new PublicKey(buffer, Network.mainnet);

const tweak2 = Buffer.from(
    "0000000000000000000000000000000000000000000000000000000000000002",
    "hex",
);

// tweak by scalar multiplication
// 024d4b6cd1361032ca9bd2aeb9d900aa4d45d9ead80ac9423374c451a7254d0766
const newPubKey = publicKey.tweakMul(tweak2);
```

Two public keys can be added together. They must be part of the same
network. This returns a new instance with the same
compressed/uncompressed value as the original public key.

```typescript
import { PublicKey } from "@node-lightning/bitcoin";

const pubkeyA = new PublicKey(
    Buffer.from("031b84c5567b126440995d3ed5aaba0565d71e1834604819ff9c17f5e9d5dd078f", "hex"),
    Network.mainnet,
);

const pubkeyB = new PublicKey(
    Buffer.from("024d4b6cd1361032ca9bd2aeb9d900aa4d45d9ead80ac9423374c451a7254d0766", "hex"),
    Network.mainnet,
);

// Adds two points together
// 02531fe6068134503d2723133227c867ac8fa6c83c537e9a44c3c5bdbdcb1fe337
const newPubKey = pubkeyA.add(pubkeyB);
```

## Transaction Building

Transaction building uses the `TxBuilder` class. This class allows modification of the `version` and `locktime`. It also allows addition of inputs and outputs via the `addInput` and `addOutput` methods.

A typical workflow for transaction building looks like:

1. Create the builder
2. Set the version
3. Set the locktime
4. Add inputs via their outpoint
5. Add outputs by specifying a value in Bitcoin and including a locking script
6. Sign your inputs and assign the signature to corresponding input's ScriptSig

A simple example looks like:

```typescript
// here are some dummy values that are needed
const privA; // 32-byte private key
const pubkeyA; // 33-byte compressed public key
const pubkeyhashB; // 20-byte hash of B's public key

// construct a builder
const txb = new TxBuilder();

// attach a single input that has 50 bitcoin in it
txb.addInput("9d0e63ad73020a9fad0106b6727e31d36e3ab4b9a01451233926d4759569de68:0");

// attach a spending output that pays to B's pubkeyhash
txb.addOutput(1, Script.p2pkhLock(pubkeyhashB));

// attach a change output that pays back to A's pubkey
txb.addOutput(48.9999, Script.p2pkhLock(pubkeyA));

// sign the input using the prior locking script
const commitScript = Script.p2pkhLock(pubkeyA);
const sig = txb.sign(0, commitScript, privA);

// create the scriptSig for the input that includes the signature and pubkey
// corresponding to the signature
txb.inputs[0].scriptSig = Script.p2pkhUnlock(sig, pubkeyA);

// convert the transaction into an immutable transaction
const tx = tx.toTx();
```

#### Legacy

-   [Spend P2PKH to P2PKH output](https://github.com/altangent/node-lightning/blob/0df3d5049221b74845eb6b86724e04c6bf45845d/packages/bitcoin/__tests__/TxBuilder.spec.ts#L53)
-   [Spend P2PK to P2PK output](https://github.com/altangent/node-lightning/blob/0df3d5049221b74845eb6b86724e04c6bf45845d/packages/bitcoin/__tests__/TxBuilder.spec.ts#L67)
-   [Spend P2PKH to P2SH-P2PKH](https://github.com/altangent/node-lightning/blob/0df3d5049221b74845eb6b86724e04c6bf45845d/packages/bitcoin/__tests__/TxBuilder.spec.ts#L81)
-   [Spend P2PKH to P2MS](https://github.com/altangent/node-lightning/blob/0df3d5049221b74845eb6b86724e04c6bf45845d/packages/bitcoin/__tests__/TxBuilder.spec.ts#L950)
-   [Spend P2MS to P2PKH](https://github.com/altangent/node-lightning/blob/0df3d5049221b74845eb6b86724e04c6bf45845d/packages/bitcoin/__tests__/TxBuilder.spec.ts#L109)
-   [Spend P2SH-P2PKH to P2SH](https://github.com/altangent/node-lightning/blob/0df3d5049221b74845eb6b86724e04c6bf45845d/packages/bitcoin/__tests__/TxBuilder.spec.ts#L125)
-   [Spend P2SH to P2SH](https://github.com/altangent/node-lightning/blob/0df3d5049221b74845eb6b86724e04c6bf45845d/packages/bitcoin/__tests__/TxBuilder.spec.ts#L144)
-   [Spend P2PKH to P2SH-P2MS](https://github.com/altangent/node-lightning/blob/0df3d5049221b74845eb6b86724e04c6bf45845d/packages/bitcoin/__tests__/TxBuilder.spec.ts#L1680)
-   [Spend P2SH-P2MS to P2PKH](https://github.com/altangent/node-lightning/blob/0df3d5049221b74845eb6b86724e04c6bf45845d/packages/bitcoin/__tests__/TxBuilder.spec.ts#L182)

#### Special Transactions

-   [Spend P2PKH with OP_RETURN](https://github.com/altangent/node-lightning/blob/0df3d5049221b74845eb6b86724e04c6bf45845d/packages/bitcoin/__tests__/TxBuilder.spec.ts#L200)
-   [Spend P2PKH with BIP125 RBF](https://github.com/altangent/node-lightning/blob/0df3d5049221b74845eb6b86724e04c6bf45845d/packages/bitcoin/__tests__/TxBuilder.spec.ts#L218)
-   [Spend using CPFP](https://github.com/altangent/node-lightning/blob/0df3d5049221b74845eb6b86724e04c6bf45845d/packages/bitcoin/__tests__/TxBuilder.spec.ts#L252)
-   [Spend to block based CLTV](https://github.com/altangent/node-lightning/blob/0df3d5049221b74845eb6b86724e04c6bf45845d/packages/bitcoin/__tests__/TxBuilder.spec.ts#L278)
-   [Spend to time based CLTV](https://github.com/altangent/node-lightning/blob/0df3d5049221b74845eb6b86724e04c6bf45845d/packages/bitcoin/__tests__/TxBuilder.spec.ts#L313)
-   [Spend to block CSV delay](https://github.com/altangent/node-lightning/blob/0df3d5049221b74845eb6b86724e04c6bf45845d/packages/bitcoin/__tests__/TxBuilder.spec.ts#L348)
-   [Spend to time CSV delay](https://github.com/altangent/node-lightning/blob/0df3d5049221b74845eb6b86724e04c6bf45845d/packages/bitcoin/__tests__/TxBuilder.spec.ts#L387)

#### Native P2WPKH

-   [Spend P2PKH to P2WPKH](https://github.com/altangent/node-lightning/blob/18bdad9e7e2203e21402c6e28cd85fdc3ed551e4/packages/bitcoin/__tests__/TxBuilder.spec.ts#L483)
-   [Spend P2WPKH to P2WPKH](https://github.com/altangent/node-lightning/blob/18bdad9e7e2203e21402c6e28cd85fdc3ed551e4/packages/bitcoin/__tests__/TxBuilder.spec.ts#L530)

#### P2SH-P2WPKH

-   [Spend P2PKH to P2SH-P2WPKH](https://github.com/altangent/node-lightning/blob/18bdad9e7e2203e21402c6e28cd85fdc3ed551e4/packages/bitcoin/__tests__/TxBuilder.spec.ts#L584)
-   [Spend P2SH-P2WPKH to P2WPKH](https://github.com/altangent/node-lightning/blob/18bdad9e7e2203e21402c6e28cd85fdc3ed551e4/packages/bitcoin/__tests__/TxBuilder.spec.ts#L598)

#### Native P2WSH

-   [Spend P2PKH to P2WSH(P2MS)](https://github.com/altangent/node-lightning/blob/18bdad9e7e2203e21402c6e28cd85fdc3ed551e4/packages/bitcoin/__tests__/TxBuilder.spec.ts#L553)
-   [Spend P2WSH(P2MS) to P2WPKH](https://github.com/altangent/node-lightning/blob/18bdad9e7e2203e21402c6e28cd85fdc3ed551e4/packages/bitcoin/__tests__/TxBuilder.spec.ts#L567)

#### P2SH-P2WSH

-   [Spend P2PKH to P2SH-P2WSH](https://github.com/altangent/node-lightning/blob/18bdad9e7e2203e21402c6e28cd85fdc3ed551e4/packages/bitcoin/__tests__/TxBuilder.spec.ts#L688)
-   [Spend P2SH-P2WSH to P2PKH](https://github.com/altangent/node-lightning/blob/18bdad9e7e2203e21402c6e28cd85fdc3ed551e4/packages/bitcoin/__tests__/TxBuilder.spec.ts#L709)

-   [Spend P2PKH to P2SH-P2WSH(P2MS)](https://github.com/altangent/node-lightning/blob/18bdad9e7e2203e21402c6e28cd85fdc3ed551e4/packages/bitcoin/__tests__/TxBuilder.spec.ts#L642)
-   [Spend P2SH-P2WSH(P2MS) to P2WPKH](https://github.com/altangent/node-lightning/blob/18bdad9e7e2203e21402c6e28cd85fdc3ed551e4/packages/bitcoin/__tests__/TxBuilder.spec.ts#L659)
