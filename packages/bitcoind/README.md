# @node-lightning/bitcoind

This package provides connectivity to a bitcoind node by enabling RPC functions
and Zeromq streaming.

This package has an external dependency on the
[zeromq](https://www.npmjs.com/package/zeromq) package.

## Example Usage

You can connect to a bitcoind instance by providing rpc and zeromq options.

```typescript
const bitciondOptions = {
  host: "127.0.0.1",
  port: 8333,
  rpcuser: "user",
  rpcpassword: "pass",
  zmqpubrawtx: "tcp://127.0.0.1:18332"
  zmqpubrawblock: "tcp://127.0.0.1:18333";
}
const client = new BitcoindClient(bitcoindOptions);
```

You can subscribe to raw transactions and blocks emitted by zeromq:

```typescript
client.subscribeRawTx();
client.on("rawtx", (rawtx: Buffer) => {
    // deserialize and do something
});
```

```typescript
client.subscribeRawBlock();
client.on("rawblock", (rawblock: Buffer) => {
    // deserialize and do something
});
```

You can call RPC functions:

```typescript
// blockchain info
await client.getBlockchainInfo();

// returns the block hash for a height
await client.getBlockHash(0);

// returns a BlockSummary
await client.getBlock("000000000019d6689c085ae165831e934ff763ae46a2a6c172b3f1b60a8ce26f");

// returns a Buffer
await client.getRawBlock("000000000019d6689c085ae165831e934ff763ae46a2a6c172b3f1b60a8ce26f");

// returns a Transaction
await client.getTransaction("aa5f3068b53941915d82be382f2b35711305ec7d454a34ca69f8897510db7ab8");

// returns a Buffer
await client.getRawTransaction("aa5f3068b53941915d82be382f2b35711305ec7d454a34ca69f8897510db7ab8");

// returns a Utxo
await client.getUtxo("aa5f3068b53941915d82be382f2b35711305ec7d454a34ca69f8897510db7ab8", 0);
```
