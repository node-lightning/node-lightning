import * as crypto from "@lntools/crypto";
import { InitMessage } from "../lib/messages/init-message";
import { Peer } from "../lib/Peer";
import { PeerServer } from "../lib/PeerServer";
import { createFakeLogger } from "./_test-utils";

const serverSecret = Buffer.alloc(32, 1);
const serverPubKey = crypto.getPublicKey(serverSecret, true);

const clientSecret = Buffer.alloc(32, 2);
const clientPubKey = crypto.getPublicKey(clientSecret, true);

const initFactory = () => new InitMessage();

function createRemotePeer() {
  return new Peer(clientSecret, initFactory, createFakeLogger());
}

function createServer() {
  const ls = Buffer.alloc(32, 1);
  const logger = createFakeLogger();
  return new PeerServer("127.0.0.1", 10000, ls, initFactory, logger);
}

describe("PeerServer", () => {
  let server: PeerServer;
  let client: Peer;

  after(() => {
    client.disconnect();
    server.shutdown();
  });

  it("emits a peer when connected", done => {
    server = createServer();
    client = createRemotePeer();

    server.on("peer_connected", () => {
      done();
    });

    server.on("listening", () => {
      client.connect(serverPubKey, "127.0.0.1", 10000);
    });

    server.listen();
  });
});
