import { BitcoindClient } from "@node-lightning/bitcoind";
import { Wallet } from "./Wallet";
import { Logger, ConsoleTransport, LogLevel } from "@node-lightning/logger";

import config from "../config.json";
import {
    Address,
    HashValue,
    LockTime,
    Network,
    Script,
    TxBuilder,
    Value,
} from "@node-lightning/bitcoin";

async function run() {
    const logger = new Logger("app");
    logger.transports.push(new ConsoleTransport(console));
    logger.level = LogLevel.Debug;

    const bitcoind = new BitcoindClient(config.bitcoind);

    // genesis block
    Network.regtest.genesisHash = HashValue.fromRpc(await bitcoind.getBlockHash(0));

    const wallet = new Wallet(logger, Network.regtest, bitcoind);

    const address = await bitcoind.getNewAddress();
    logger.info("created address", address);
    const addressScript = Address.decodeBech32(address);

    const fundingAmount = Value.fromBitcoin(55.55);

    const builder = new TxBuilder();
    builder.locktime = LockTime.zero();
    builder.addOutput(Value.fromBitcoin(55.55), Script.p2wpkhLock(addressScript.program));

    const tx = await wallet.fundTx(builder);
    logger.debug("tx", tx.toHex());

    await wallet.broadcastTx(tx);
}

run().catch(console.error);
