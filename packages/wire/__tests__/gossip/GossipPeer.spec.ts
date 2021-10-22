/* eslint-disable no-constant-condition */
// tslint:disable: max-classes-per-file
// tslint:disable: no-unused-expression
import { BitField } from "@node-lightning/core";
import { ILogger } from "@node-lightning/logger";
import { expect } from "chai";
import sinon from "sinon";
import { Duplex } from "stream";
import {
    GossipFilter,
    GossipMemoryStore,
    GossipPeer,
    WireError,
    WireErrorCode,
} from "../../lib";
import { IWireMessage } from "../../lib";
import { InitFeatureFlags } from "../../lib/flags/InitFeatureFlags";
import { Peer } from "../../lib/Peer";
import { PeerState } from "../../lib/PeerState";
import { PingPongState } from "../../lib/PingPongState";
import { createFakeLogger } from "../_test-utils";

class FakeSocket extends Duplex {
    [x: string]: any;
    public outgoing: Buffer[] = [];

    constructor() {
        super({ objectMode: true });
        this.pipe = sinon.spy(this.pipe.bind(this));
        this.end = sinon.spy(this.end.bind(this));
        this.rpk = Buffer.alloc(33);
    }

    public _write(data: any, encoding: BufferEncoding, cb: (err?: Error) => void) {
        this.outgoing.push(data);
        cb();
    }

    public _read() {
        // nada
    }

    public simReceive(data: Buffer) {
        this.push(data);
    }
}

describe("GossipPeer", () => {
    let sut: GossipPeer;
    let chainHashes: Buffer[];
    let peer: Peer;
    let ls: Buffer;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const rpk: Buffer = Buffer.alloc(32, 1);
    let logger: ILogger;
    let sandbox: sinon.SinonSandbox;
    let socket: FakeSocket;
    let localFeatures: BitField<InitFeatureFlags>;
    let remoteFeatures: BitField<InitFeatureFlags>;
    let filter: GossipFilter;

    beforeEach(() => {
        chainHashes = [Buffer.alloc(32, 0xff)];
        localFeatures = new BitField<InitFeatureFlags>();
        localFeatures.set(InitFeatureFlags.optionDataLossProtectOptional);
        remoteFeatures = new BitField<InitFeatureFlags>();
        remoteFeatures.set(InitFeatureFlags.optionDataLossProtectOptional);
        remoteFeatures.set(InitFeatureFlags.gossipQueriesOptional);
        ls = Buffer.alloc(32, 0);
        logger = createFakeLogger();
        peer = new Peer(ls, localFeatures, chainHashes, logger, 1);
        socket = new FakeSocket();
        peer.attach(socket as any);
        peer.pingPongState = sinon.createStubInstance(PingPongState) as any;
        peer.state = PeerState.Ready;
        peer.remoteFeatures = remoteFeatures;
        sandbox = sinon.createSandbox();

        const gossipStore = new GossipMemoryStore();
        const pendingStore = new GossipMemoryStore();
        filter = new GossipFilter(gossipStore, pendingStore);

        sut = new GossipPeer(peer, filter, logger);
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe("integation - wire messages", () => {
        it("it should process all valid messages", done => {
            const hexMsgs = [
                "0100ce1d69dbb62e86ad28157f4c24705e325f069d5158b91b28bdf55e508afcc1b554a498f4bda8a3d34a206ddb617ad0e945ecadc9a61086bac5afae3e19976242d464e8d305772f29021a4d07617c4159e7e0634bd53991c0e0577c0e9c3d3ee61d7311e6773275335c12f17e573e2813391a71050ab58c03c17d06c0d841db2ec6c6514c2156713651dfbee13d491559764c95343386218ab904173742dde6ca3118d303967e073a44e94f16eef4d878d4d74f1ff1f6924109421cf9c41e8e5c961cf1c7e2316e61a952c7caad056fea1d13d2f4bf855bd3f06d019a33814bc70ea99fa79f026c791b87040e781e8493f5165dafbfc23fabe2912c3ed0ab7e0f000043497fd7f826957108f4a30fd9cec3aeba79972084e90ead01ea33090000000013a9090000030000036b96e4713c5f84dcb8030592e1bd42a2d9a43d91fa2e535b9bfd05f2c5def9b9039cc950286a8fa99218283d1adc2456e0d5e81be558da77dd6e85ba9a1fff5ad303ca63b9acbadf5b644c11d0a9dd65b82b14e0d26fc5e0bcf071a90879f603d46203a0ee0a716f4a436864fe53bb788a003321aee63150bf63fd5529e4e1da93481d",
                "01024e6eac97124742ba6a033612c8009945c0d52568756a885692b4adbf202666503b56ecb6f5758ea450dda940b2a6853b8e1706c3bd4f38a347be91b08c5e5c4743497fd7f826957108f4a30fd9cec3aeba79972084e90ead01ea33090000000013a90900000300005cdd9d780002009000000000000003e8000003e800000001",
                "01015254ffbc21374af9d998355151515933de1d998e9cb124aa4d65a7aa6b473e75201420c58f2414f4fb7461f3f133ab529cbbf9a57365ed6bcf775172826fdc7500005ae86dba039cc950286a8fa99218283d1adc2456e0d5e81be558da77dd6e85ba9a1fff5ad3f8e71c79616c6c732e6f7267000000000000000000000000000000000000000000000000070122c8fc922607",
                "0102fcd0d7af22e815879e2ba0c2422bc812d04f8b286fd53e631fe18bb6ed5aecc06a0b96fceb352509656f2b121b76cc808fe02e62ff42edc600bd6e196fe2af9b43497fd7f826957108f4a30fd9cec3aeba79972084e90ead01ea33090000000013a90900000300005ae7cc490001009000000000000003e8000003e800000001",
                "010105d3b12aacb824409ce8724609fe453fdcd33a498ecca170784985c4a6a2765657c4ef9e1170d3a5795ec86021c3a081c84a9f3a02e2ca66d17b683baacae08000005cddd5e5036b96e4713c5f84dcb8030592e1bd42a2d9a43d91fa2e535b9bfd05f2c5def9b9b6d43364656d6f312e6c6e646578706c6f7265722e636f6d0000000000000000000000000701265736a32611",
            ];

            const msgs = [];
            sut.on("readable", () => {
                while (true) {
                    const msg = sut.read() as IWireMessage;
                    if (!msg) break;
                    msgs.push(msg);
                }
                if (msgs.length === hexMsgs.length) done();
            });

            for (const hexMsg of hexMsgs) {
                const buffer = Buffer.from(hexMsg, "hex");
                socket.simReceive(buffer);
            }
        });

        it("it should continue processing after errors", done => {
            const hexMsgs = [
                "0100ce1d69dbb62e86ad28157f4c24705e325f069d5158b91b28bdf55e508afcc1b554a498f4bda8a3d34a206ddb617ad0e945ecadc9a61086bac5afae3e19976242d464e8d305772f29021a4d07617c4159e7e0634bd53991c0e0577c0e9c3d3ee61d7311e6773275335c12f17e573e2813391a71050ab58c03c17d06c0d841db2ec6c6514c2156713651dfbee13d491559764c95343386218ab904173742dde6ca3118d303967e073a44e94f16eef4d878d4d74f1ff1f6924109421cf9c41e8e5c961cf1c7e2316e61a952c7caad056fea1d13d2f4bf855bd3f06d019a33814bc70ea99fa79f026c791b87040e781e8493f5165dafbfc23fabe2912c3ed0ab7e0f000043497fd7f826957108f4a30fd9cec3aeba79972084e90ead01ea33090000000013a9090000030000036b96e4713c5f84dcb8030592e1bd42a2d9a43d91fa2e535b9bfd05f2c5def9b9039cc950286a8fa99218283d1adc2456e0d5e81be558da77dd6e85ba9a1fff5ad303ca63b9acbadf5b644c11d0a9dd65b82b14e0d26fc5e0bcf071a90879f603d46203a0ee0a716f4a436864fe53bb788a003321aee63150bf63fd5529e4e1da93481d",
                "01024e6eac97124742ba6a033612c8009945c0d52568756a885692b4adbf202666503b56ecb6f5758ea450dda940b2a6853b8e1706c3bd4f38a347be91b08c5e5c4743497fd7f826957108f4a30fd9cec3aeba79972084e90ead01ea33090000000013a90900000300005cdd9d780002009000000000000003e8000003e800000001",
                "01010254ffbc21374af9d998355151515933de1d998e9cb124aa4d65a7aa6b473e75201420c58f2414f4fb7461f3f133ab529cbbf9a57365ed6bcf775172826fdc7500005ae86dba039cc950286a8fa99218283d1adc2456e0d5e81be558da77dd6e85ba9a1fff5ad3f8e71c79616c6c732e6f7267000000000000000000000000000000000000000000000000070122c8fc922607",
                "0102fcd0d7af22e815879e2ba0c2422bc812d04f8b286fd53e631fe18bb6ed5aecc06a0b96fceb352509656f2b121b76cc808fe02e62ff42edc600bd6e196fe2af9b43497fd7f826957108f4a30fd9cec3aeba79972084e90ead01ea33090000000013a90900000300005ae7cc490001009000000000000003e8000003e800000001",
                "010105d3b12aacb824409ce8724609fe453fdcd33a498ecca170784985c4a6a2765657c4ef9e1170d3a5795ec86021c3a081c84a9f3a02e2ca66d17b683baacae08000005cddd5e5036b96e4713c5f84dcb8030592e1bd42a2d9a43d91fa2e535b9bfd05f2c5def9b9b6d43364656d6f312e6c6e646578706c6f7265722e636f6d0000000000000000000000000701265736a32611",
            ];

            const msgs = [];
            const errors: WireError[] = [];
            function validate() {
                if (msgs.length + errors.length === hexMsgs.length) {
                    expect(errors[0].code == WireErrorCode.nodeAnnSigFailed);
                    done();
                }
            }

            sut.on("readable", () => {
                while (true) {
                    const msg = sut.read() as IWireMessage;
                    if (!msg) break;
                    msgs.push(msg);
                }
                validate();
            });

            sut.on("gossip_error", error => {
                errors.push(error);
                validate();
            });

            for (const hexMsg of hexMsgs) {
                const buffer = Buffer.from(hexMsg, "hex");
                socket.simReceive(buffer);
            }
        });
    });
});
