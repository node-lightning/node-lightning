import { BitcoindClient } from "@node-lightning/bitcoind";
import { Wallet } from "./Wallet";

import config from "../config.json";
import { Address, HashValue, Network, Script, TxBuilder, Value } from "@node-lightning/bitcoin";

async function run() {
    const bitcoind = new BitcoindClient(config.bitcoind);

    // genesis block
    Network.regtest.genesisHash = HashValue.fromRpc(await bitcoind.getBlockHash(0));

    const wallet = new Wallet(Network.regtest, bitcoind);

    const address = await bitcoind.getNewAddress();
    console.log("created", address);
    const addressScript = Address.decodeBech32(address);

    const builder = new TxBuilder();
    builder.addOutput(Value.fromBitcoin(55.55), Script.p2wpkhLock(addressScript.program));

    const tx = await wallet.fundTx(builder);

    const tx2 = await wallet.signFundingTx(tx);
    console.log(tx2.toJSON());
    console.log(tx2.toHex());
}

run().catch(console.error);
