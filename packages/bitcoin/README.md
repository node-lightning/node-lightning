# @node-lightning/bitcoin

This package provides common Bitcoin functionality and does not rely on third party libraries.

## PrivateKey

The `PrivateKey` enables functionality used by private key values
for the secp256k1 elliptic curve used by Bitcoin. Valid values are between
1 and 115792089237316195423570985008687907853177846645995842846068537748949929705792.
This class includes methods for key tweaks, serialization to/from WIF,
and creation of the public key point which results in a `PublicKey` type.

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

## Public Key

The `PublicKey` type encapsulates a public key point on an secp256k1
elliptic curve. The type is constructed by supplying a buffer in SEC
compressed or uncompressed format as well as the network the public key
belongs to.

```typescript
import { PublicKey } from "@node-lightning/bitcoin";

// 33-byte SEC encoded compressed point
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

## Mnemonic Seeds (BIP39)

You can use this library to create mnemonic seeds from some entropy
source. The word list is the default english word list defined in BIP39.
Entropy must be between 16 and 32 bytes and should be created via a
cryptographically secure mechanism.

```typescript
import { Mnemonic } from "@node-ligthning/bitcoin";

// non-cryptographically secure means of entropy...
// 0101010101010101010101010101010101010101010101010101010101010101
const entropy = Buffer.alloc(32, 0x01);

// create a phrase from entropy
const phrase = Mnemonic.entropyToPhrase(entropy);

// absurd amount doctor acoustic avoid letter advice cage absurd amount doctor acoustic avoid letter advice cage absurd amount doctor acoustic avoid letter advice comic
console.log(phrase);
```

With a phrase, you can generate a 64-byte seed from a seed phrase.

```typescript
const phrase =
    "absurd amount doctor acoustic avoid letter advice cage absurd amount doctor acoustic avoid letter advice cage absurd amount doctor acoustic avoid letter advice comic";

// password is optional
const password = "w00t";

// generates the seed that can be used with PrivateKey or HdPrivateKey.
const seed = Mnemonic.phraseToSeed(phrase, password);

//fca9d8565ad4c06b5326a1d1983ddf323b0e5e3e89d5264dad9001a13e649c1f4d9fa69eccb08e6589eb0ff39f2522240889d737ea711f2439f2bb5b302f061d
console.log(seed.toString("hex"));
```

A phrase can also be converted back to entropy:

```typescript
const phrase =
    "absurd amount doctor acoustic avoid letter advice cage absurd amount doctor acoustic avoid letter advice cage absurd amount doctor acoustic avoid letter advice comic";

const entropy = Mnemonic.phraseToEntropy(phrase);

// 0101010101010101010101010101010101010101010101010101010101010101
console.log(entropy.toString("hex"));
```

## HD Keys (BIP32/BIP49/BIP84)

This library enables hierarchical deterministic keys (HD keys) as defined
in BIP32. HD Keys are represented in two clases: `HdPrivateKey` and `HdPublicKey`.
These keys encapsulate a `PrivateKey` and `PublicKey` respectively and
include a `derive` method for deriving a child key. This library supports
xpub, ypub, and zpub addresses.

```typescript
import { Mnemonic, HdPrivateKey, HdPublicKey } from "@node-lightning/bitcoin";

// some seed
const seed = Mnemonic.phraseToSeed(
    "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about",
);

// generates the master key, path=m, and is for x-type HD Keys
const master = HdPrivateKey.fromSeed(seed, Network.mainnet, HdKeyType.x);

// derive a non-hardened child
master.derive(0);

// derive a hardened child
master.derive(0x80000000 + 1);

// access the underlying private key
//1837c1be8e2995ec11cda2b066151be2cfb48adf9e47b151d46adab3a21cdf67
master.privateKey.toHex();
```

An HdPrivateKey can be derived from a supplied path. Paths must start with
`m` and each level is delimited by `/`. Each level must be a number.
Hardened levels are a number suffixed with `'`.

```typescript
// hd private key at m/0'/0'/0'/0/0
HdPrivateKey.fromPath("m/0'/0'/0'/0/0", seed, Network.mainnet, HdKeyType.x);
```

An HdPrivateKey can be exported in the xprv, yprv, or zprv format.

```typescript
// generates an x-type key at the path
key = HdPrivateKey.fromPath("m/0'/0'/0'/0/0", seed, Network.mainnet, HdKeyType.x);

// xprvA2ahXMijxBZowqFxRDLYUtByAy43A7A3g2PfnkbpJhNuhXTfFuFCe7bCrK2BcWSEy3dhkPURJKHfaxwACzg9CrSLe5cRZeAugEHkWGyiM1e
key.encode();

// generates a y-type key at the path
key = HdPrivateKey.fromPath("m/0'/0'/0'/0/0", seed, Network.mainnet, HdKeyType.y);

// yprvAMQxq2Pf6s7Ho8T5Fa8AgyHULwCV6j9Yb8uta9VhghknkdGtWZQmGBFLsWymcR6ANgkWVs4ykyeDUFYivh6A167wWRJr9YzPwxMPtqFiNLF
key.encode();

// generates z y-type key at the path
key = HdPrivateKey.fromPath("m/0'/0'/0'/0/0", seed, Network.mainnet, HdKeyType.z);

// zprvAgFE8h4aFYemeReC5vunu4NyWuLw3M93WFS7MYPb4i8foj67mDaKtEuUtiwMcKk5nKsKFLfYDdzmMYAHePWAoKoYNm1GjTotDgR3HRDc2a1
key.encode();
```

A private key can be imported from the xprv, yprv, or zprv format.

```typescript
// decodes an x-type key
HdPrivateKey.decode(
    "xprvA2ahXMijxBZowqFxRDLYUtByAy43A7A3g2PfnkbpJhNuhXTfFuFCe7bCrK2BcWSEy3dhkPURJKHfaxwACzg9CrSLe5cRZeAugEHkWGyiM1e",
);

// decodes a y-type key
HdPrivateKey.decode(
    "yprvAMQxq2Pf6s7Ho8T5Fa8AgyHULwCV6j9Yb8uta9VhghknkdGtWZQmGBFLsWymcR6ANgkWVs4ykyeDUFYivh6A167wWRJr9YzPwxMPtqFiNLF",
);

// decodes a z-type key
HdPrivateKey.decode(
    "zprvAgFE8h4aFYemeReC5vunu4NyWuLw3M93WFS7MYPb4i8foj67mDaKtEuUtiwMcKk5nKsKFLfYDdzmMYAHePWAoKoYNm1GjTotDgR3HRDc2a1",
);
```

A private key can be convered into an `HdPublicKey`

```typescript
const privateKey = HdPrivateKey.fromPath("m/0'/0'/0'/0/0", seed, Network.mainnet, HdKeyType.x);

const publicKey = privateKey.toPubKey();
```

A non-hardened `HdPublicKey` can be used to derive non-hardened child
public keys.

```typescript
const childPubKey = publicKey.derivePublic(0);
```

An `HdPublicKey can be exported in the xpub, ypub, or zpub format.

```typescript
// generates an x-type key at the path
privateKey = HdPrivateKey.fromPath("m/0'/0'/0'/0/0", seed, Network.mainnet, HdKeyType.x);
publicKey = privateKey.toPubKey();

// xpub6Fa3vsFdnZ87AKLRXEsYr28hiztXZZsu3FKGb91Rs2utaKnooSZTBuughdaGXP1pXiB6LHac732AtbAGsXtouqRuQL3FycZ23QKkWcoyDRD
publicKey.encode();

// generates a y-type key at the path
privateKey = HdPrivateKey.fromPath("m/0'/0'/0'/0/0", seed, Network.mainnet, HdKeyType.y);
publicKey = privateKey.toPubKey();

// ypub6aQKEXvYwEfb1cXYMbfB47ECty2yWBsPxMqVNXuKF3HmdRc346j1oyZpiqXrXHfjwMHu5mBAZhNimsmqbEJpi57WGfjgZXNWK8PPu9vso8e
publicKey.encode();

// generates z y-type key at the path
privateKey = HdPrivateKey.fromPath("m/0'/0'/0'/0/0", seed, Network.mainnet, HdKeyType.z);
publicKey = privateKey.toPubKey();

// zpub6uEaYCbU5vD4ruifBxSoGCKi4wBRSortsUMi9voCd3fegXRGJktaS3Dxk3VSXCKfLzQhqEmj2MjGfAPQJviqWJo791S79SBzarT3Hn12PPY
publicKey.encode();
```

An `HdPublicKey can be imported from the xpub, ypub, or zpub format.

```typescript
// decodes an x-type key
HdPublicKey.decode(
    "xpub6Fa3vsFdnZ87AKLRXEsYr28hiztXZZsu3FKGb91Rs2utaKnooSZTBuughdaGXP1pXiB6LHac732AtbAGsXtouqRuQL3FycZ23QKkWcoyDRD",
);

// decodes a y-type key
HdPublicKey.decode(
    "ypub6aQKEXvYwEfb1cXYMbfB47ECty2yWBsPxMqVNXuKF3HmdRc346j1oyZpiqXrXHfjwMHu5mBAZhNimsmqbEJpi57WGfjgZXNWK8PPu9vso8e",
);

// decodes a z-type key
HdPublicKey.decode(
    "zpub6uEaYCbU5vD4ruifBxSoGCKi4wBRSortsUMi9voCd3fegXRGJktaS3Dxk3VSXCKfLzQhqEmj2MjGfAPQJviqWJo791S79SBzarT3Hn12PPY",
);
```

An `HdPublicKey` can output the Bitcoin address via the `toAddress`
method. Depending on whether the key is x, y, or z type will determine
whether the address is a P2PKH, P2SH-P2WPKH, or P2WPKH address.

```typescript
const pubkey = HdPublicKey.decode(
    "xpub6Fa3vsFdnZ87AKLRXEsYr28hiztXZZsu3FKGb91Rs2utaKnooSZTBuughdaGXP1pXiB6LHac732AtbAGsXtouqRuQL3FycZ23QKkWcoyDRD",
);

// 1NqGp6acdQN62M25DJ9Wpe2QPG86B9GTxB
pubkey.toAddress();
```

```typescript
// decodes a y-type key
const pubkey = HdPublicKey.decode(
    "ypub6aQKEXvYwEfb1cXYMbfB47ECty2yWBsPxMqVNXuKF3HmdRc346j1oyZpiqXrXHfjwMHu5mBAZhNimsmqbEJpi57WGfjgZXNWK8PPu9vso8e",
);

// 3D5n213U4vX8ppiNZSzCkgZD9sneKr6PJz
pubkey.toAddress();
```

```typescript
// decodes a z-type key
pubkey = HdPublicKey.decode(
    "zpub6uEaYCbU5vD4ruifBxSoGCKi4wBRSortsUMi9voCd3fegXRGJktaS3Dxk3VSXCKfLzQhqEmj2MjGfAPQJviqWJo791S79SBzarT3Hn12PPY",
);

// bc1qaaauaz73eyjyla73u7ahrx0vrlsgf0elwqrhyv
pubkey.toAddress();
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
