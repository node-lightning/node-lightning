# @node-lightning/secp256k1

This library is heavily based on the [secp256k1](https://www.npmjs.com/package/secp256k1). The
primary changes to this library are:

-   remove dependency on Elliptic.js for in-browser usage
-   streamlined build dependencies (see below)
-   update reference to [libsecp256k1](https://github.com/bitcoin-core/secp256k1)

## Install

To improve the security of this module (reduce dependencies and allow audibility), the native build process is performed upon installation.

The build processes uses [`node-gyp`](https://www.npmjs.com/package/node-gyp) and its prerequisites must be available for the package to install correctly. Refer to the `node-gyp` [installation instructions]() for full details for your target environment.

Note: The [libsecp256k1](https://github.com/bitcoin-core/secp256k1) submodule is packaged in the bundle (prior versions of this library used `git` to fetched code). `git` is no longer an installation requirement for this module.

## Local Build

To perform a local build of the module requires initializing the `libsecp256k1` submodule:

```
git submodule update --init
```

You can then perform a standard `npm install`.

## Update upstream

Update the [libsecp256k1](https://github.com/bitcoin-core/secp256k1) submodule by

1. Finding the correct commit version (usually find the latest Bitcoin Core release and figure out which commit was imported)
1. Change to the submodule directory `cd lib/libsec256k1`
1. Checkout the commit found in step 1. `git checkout <hash>`
1. Change directory to the root of this project

At this point you can test that everything builds by:

1. Rebuilding the binaries `npm run build:native`
1. Running the tests `npm run test`

If everything passes, the submodule update can be added with `git add` and it can be committed.
