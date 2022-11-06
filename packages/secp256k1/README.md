# @node-lightning/secp256k1

This library is heavily based on the [secp256k1](https://www.npmjs.com/package/secp256k1). The
primary changes to this library are:

-   remove dependency on Elliptic.js for in-browser usage
-   streamlined build dependencies (see below)
-   update reference to [libsecp256k1](https://github.com/bitcoin-core/secp256k1)

## Install

To improve the security of this module (reduce dependencies and allow audibility), the native build process is performed upon installation.

The build processes uses [`node-gyp`](https://www.npmjs.com/package/node-gyp) and its prerequisites must be available for the package to install correctly. Refer to the `node-gyp` [installation instructions]() for full details for your target environment.

Note: The [libsecp256k1](https://github.com/bitcoin-core/secp256k1) submodule is packaged in the package bundle (prior versions fetched code) so that `git` is no longer an installation requirement.

## Local Build

To perform a local build of the module requires initializing the `libsecp256k1` submodule:

```
git submodule update --init
```

You can then perform a standard `npm install`.
