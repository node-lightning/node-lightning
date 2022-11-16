import { BitField } from "../lib/BitField";
import * as crypto from "@node-lightning/crypto";
import { InitFeatureFlags } from "../lib/flags/InitFeatureFlags";
import { Peer } from "../lib/Peer";
import { PeerServer } from "../lib/PeerServer";
import { createFakeLogger } from "./_test-utils";

const chainHash = Buffer.alloc(32, 0xff);

const serverSecret = Buffer.alloc(32, 1);
const serverPubKey = crypto.getPublicKey(serverSecret, true);

const clientSecret = Buffer.alloc(32, 2);
const clientPubKey = crypto.getPublicKey(clientSecret, true);

const localFeatures = new BitField<InitFeatureFlags>();

function createRemotePeer() {
    localFeatures.set(InitFeatureFlags.optionDataLossProtectRequired);
    localFeatures.set(InitFeatureFlags.initialRoutingSyncOptional);
    return new Peer(clientSecret, localFeatures, [chainHash], createFakeLogger());
}

function createServer() {
    const ls = Buffer.alloc(32, 1);
    const logger = createFakeLogger();
    return new PeerServer("127.0.0.1", 10000, ls, localFeatures, [chainHash], logger);
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

        server.on("peer", () => {
            done();
        });

        server.on("listening", () => {
            client.connect(serverPubKey, "127.0.0.1", 10000);
        });

        server.listen();
    });
});
