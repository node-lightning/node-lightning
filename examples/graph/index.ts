import { LogLevel, manager } from "@lntools/logger";
import { InitMessage } from "@lntools/wire";
import { Peer } from "@lntools/wire";
import { GossipMemoryStore } from "@lntools/wire";
import { GossipManager } from "@lntools/wire";
import crypto from "crypto";
import fs from "fs";

manager.level = LogLevel.Debug;
const logger = manager.create("root");

class App {
  public static async main() {
    try {
      const app = new App();
      const key = await app.loadOrCreateKey();
      await app.connectToPeer(key);
      process.stdin.resume();
    } catch (err) {
      logger.error(err);
      process.exit(1);
    }
  }

  public async loadOrCreateKey() {
    try {
      return fs.readFileSync("./secret.key");
    } catch (ex) {
      const key = crypto.randomBytes(32);
      logger.info("create local secret", key.toString("hex"));
      fs.writeFileSync("./secret.key", key);
      return fs.readFileSync("./secret.key");
    }
  }

  public async connectToPeer(ls: Buffer) {
    logger.info("local secret", ls.toString("hex"));

    // chain_hash
    const chainHash = Buffer.from(
      "43497fd7f826957108f4a30fd9cec3aeba79972084e90ead01ea330900000000",
      "hex",
    );

    // demo1.lndexplorer.com
    const rpk = Buffer.from("036b96e4713c5f84dcb8030592e1bd42a2d9a43d91fa2e535b9bfd05f2c5def9b9", "hex"); // prettier-ignore
    const host = "38.87.54.163";
    const port = 9745;

    // demo2.lndexplorer.com
    // let rpk = Buffer.from("03b1cf5623ca6757d49de3b6e2b9340065ba991c75b8e9cd8aec51dc54322cbd1d", "hex"); // prettier-ignore
    // let host = "38.87.54.164";
    // let port = 9745;

    // endurance (ACINQ - Eclair)
    // let rpk = Buffer.from("03933884aaf1d6b108397e5efe5c86bcf2d8ca8d2f700eda99db9214fc2712b134", "hex"); // prettier-ignore
    // let host = "34.250.234.192";
    // let port = 9735;

    const initMessageFactory = () => {
      const initMessage = new InitMessage();

      // set initialization messages
      initMessage.localInitialRoutingSync = false;
      initMessage.localDataLossProtect = true;
      initMessage.localGossipQueries = true;
      initMessage.localGossipQueriesEx = true;
      return initMessage;
    };

    const peer = new Peer(initMessageFactory);
    peer.logger = logger;

    const gossipStore = new GossipMemoryStore();
    const pendingStore = new GossipMemoryStore();
    const gossipManager = new GossipManager({
      chainHash,
      logger,
      gossipStore,
      pendingStore,
    });

    gossipManager.addPeer(peer);

    let counter = 0;
    gossipManager.on("message", msg => logger.info("msg: %d, type: %d", ++counter, msg.type));

    peer.connect({ ls, rpk, host, port });
    peer.on("error", err => logger.error("%s", err.stack));
    peer.on("ready", () => logger.info("peer is ready"));
  }
}

App.main();
