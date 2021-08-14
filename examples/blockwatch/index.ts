import {
    BitcoindClient,
    RetryPolicy,
    ConstantBackoff,
    BlockSummary,
} from "@node-lightning/bitcoind";
import { BlockWatcher } from "@node-lightning/chainmon";
import { Logger, ConsoleTransport, LogLevel } from "@node-lightning/logger";

// tslint:disable-next-line: no-var-requires
const config = require("../config.json");

const logger = new Logger("app");
logger.transports.push(new ConsoleTransport(console));
logger.level = LogLevel.Debug;

async function start() {
    // configure the Bitcoind chain client that is used to
    // validate validatity of funding transactions associated
    // with channels inside the ChannelFilter
    const chainClient = new BitcoindClient({
        ...config.bitcoind,
    });

    const hash = "0000000000000031078fb977e7ed45acd3196d4efb7298b236fc9e3ccc4e78ad";
    const header = await chainClient.getHeader(hash);

    const onConnect: (block: BlockSummary) => Promise<void> = (block: any) => Promise.resolve();
    const onDisconnect: (block: BlockSummary) => Promise<void> = (block: any) => Promise.resolve();

    const blockWatcher = new BlockWatcher(chainClient, header, onDisconnect, onConnect, logger);

    blockWatcher.start();
}

start()
    .then(() => {
        process.stdin.resume();
    })
    .catch(err => {
        logger.error(err);
        process.exit(1);
    });
