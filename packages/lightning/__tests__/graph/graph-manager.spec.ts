// tslint:disable: no-unused-expression
import { BitField } from "@node-lightning/core";
import { ShortChannelId } from "@node-lightning/core";
import { OutPoint } from "@node-lightning/core";
import { AddressIPv4 } from "../../lib/domain/AddressIPv4";
import { ExtendedChannelAnnouncementMessage } from "../../lib/messages/ExtendedChannelAnnouncementMessage";
import { ChannelAnnouncementMessage } from "../../lib/messages/ChannelAnnouncementMessage";
import { ChannelUpdateMessage } from "../../lib/messages/ChannelUpdateMessage";
import { NodeAnnouncementMessage } from "../../lib/messages/NodeAnnouncementMessage";
import { expect } from "chai";
import { Channel } from "../../lib/graph/channel";
import { ChannelSettings } from "../../lib/graph/channel-settings";
import { GraphErrorCode } from "../../lib/graph/graph-error";
import { GraphManager } from "../../lib/graph/graph-manager";
import { Node } from "../../lib/graph/node";

describe("GraphManager", () => {
    let sut: GraphManager;
    const scid = new ShortChannelId(1, 1, 1);
    const node1 = Buffer.alloc(32, 1);
    const node2 = Buffer.alloc(32, 2);

    beforeEach(() => {
        sut = new GraphManager();
    });

    describe("channel_announcement", () => {
        describe("new channel", () => {
            function createMsg() {
                const msg = new ChannelAnnouncementMessage();
                msg.shortChannelId = scid;
                msg.nodeId1 = node1;
                msg.nodeId2 = node2;
                msg.features = new BitField();
                return msg;
            }

            it("should add a channel to the graph", done => {
                const msg = createMsg();

                sut.on("channel", () => {
                    const chan = sut.graph.getChannel(scid);
                    expect(chan.shortChannelId).to.be.instanceof(ShortChannelId);
                    done();
                });
                sut.onWireMessage(msg);
            });

            it("should add node1 and node2 to graph", done => {
                const msg = createMsg();
                let hasNode1 = false;
                let hasNode2 = false;

                sut.on("node", n => {
                    if (n.nodeId.equals(node1)) hasNode1 = true;
                    if (n.nodeId.equals(node2)) hasNode2 = true;
                    if (!hasNode1 || !hasNode2) return;
                    const n1 = sut.graph.getNode(node1);
                    const n2 = sut.graph.getNode(node2);
                    expect(n1.nodeId.toString("hex")).to.equal(node1.toString("hex"));
                    expect(n2.nodeId.toString("hex")).to.equal(node2.toString("hex"));
                    done();
                });
                sut.onWireMessage(msg);
            });
        });

        describe("duplicate channel", () => {
            function createMsg() {
                const msg = new ChannelAnnouncementMessage();
                msg.shortChannelId = scid;
                msg.nodeId1 = node1;
                msg.nodeId2 = node2;
                msg.features = new BitField();
                return msg;
            }

            it("should not emit error", () => {
                const msg = createMsg();
                sut.onWireMessage(msg);
                sut.onWireMessage(msg);
            });
        });
    });

    describe("channel_update", () => {
        function createMsg() {
            const msg = new ChannelAnnouncementMessage();
            msg.shortChannelId = scid;
            msg.nodeId1 = node1;
            msg.nodeId2 = node2;
            msg.features = new BitField();
            return msg;
        }

        function createUpdateMsg(dir: number) {
            const msg = new ChannelUpdateMessage();
            msg.shortChannelId = scid;
            msg.channelFlags = new BitField(BigInt(dir));
            return msg;
        }

        it("should emit channel_update for side 1", () => {
            sut.on("channel_update", (c: Channel, u: ChannelSettings) => {
                expect(c.shortChannelId).to.deep.equal(scid);
                expect(u.direction).to.equal(0);

                const chan = sut.graph.getChannel(scid);
                expect(chan.node1Settings).to.equal(u);
                expect(chan.node2Settings).to.be.undefined;
            });

            sut.onWireMessage(createMsg());
            sut.onWireMessage(createUpdateMsg(0));
        });

        it("should emit channel_update for side 2", () => {
            sut.on("channel_update", (c: Channel, u: ChannelSettings) => {
                expect(c.shortChannelId).to.deep.equal(scid);
                expect(u.direction).to.equal(1);

                const chan = sut.graph.getChannel(scid);

                expect(chan.node1Settings).to.be.undefined;
                expect(chan.node2Settings).to.equal(u);
            });

            sut.onWireMessage(createMsg());
            sut.onWireMessage(createUpdateMsg(1));
        });

        it("should emit error when channel doesnt exist", done => {
            sut.on("error", err => {
                expect(err.code).to.equal(GraphErrorCode.ChannelNotFound);
                done();
            });
            sut.onWireMessage(createUpdateMsg(0));
        });
    });

    describe("node_announcement", () => {
        function createMsg() {
            const msg = new NodeAnnouncementMessage();
            msg.nodeId = node1;
            msg.features = new BitField();
            msg.timestamp = 1;
            return msg;
        }

        it("should add new node", done => {
            sut.on("node", (n: Node) => {
                expect(n.nodeId.equals(node1)).to.be.true;
                const node = sut.graph.getNode(node1);
                expect(node).to.equal(n);
                done();
            });
            sut.onWireMessage(createMsg());
        });

        it("should update existing node", done => {
            sut.onWireMessage(createMsg());
            sut.on("node", (n: Node) => {
                expect(n.lastUpdate).to.equal(2);
                expect(n.rgbColorString).to.equal("#111111");
                expect(n.aliasString).to.equal("test");
                expect(n.addresses[0]).to.deep.equal({ host: "1.1.1.1", port: 9735 });
                const node = sut.graph.getNode(node1);
                expect(node).to.equal(n);
                done();
            });
            const msg = createMsg();
            msg.timestamp = 2;
            msg.alias = Buffer.from("test");
            msg.rgbColor = Buffer.from("111111", "hex");
            msg.features = new BitField(BigInt(2));
            msg.addresses = [new AddressIPv4("1.1.1.1", 9735)];
            sut.onWireMessage(msg);
        });
    });

    describe("close channel", () => {
        function createMsg(scid: ShortChannelId, outpoint?: OutPoint) {
            const msg = new ExtendedChannelAnnouncementMessage();
            msg.shortChannelId = scid;
            msg.outpoint = outpoint;
            msg.capacity = BigInt(1000);
            msg.nodeId1 = node1;
            msg.nodeId2 = node2;
            msg.features = new BitField();
            return msg;
        }

        it("should remove a channel from the graph", () => {
            const outpoint = OutPoint.fromString("1111111111111111111111111111111111111111111111111111111111111111:1"); // prettier-ignore
            sut.onWireMessage(createMsg(new ShortChannelId(1, 1, 0)));
            sut.onWireMessage(createMsg(new ShortChannelId(1, 1, 1), outpoint));
            expect(sut.graph.channels.size).to.equal(2);
            sut.removeChannel(outpoint);
            expect(sut.graph.channels.size).to.equal(1);
        });
    });
});
