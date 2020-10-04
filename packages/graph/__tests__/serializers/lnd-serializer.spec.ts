import { shortChannelIdFromNumber } from "@node-lightning/core";
import { OutPoint } from "@node-lightning/core";
import { AddressIPv4, AddressTor2, AddressTor3 } from "@node-lightning/wire";
import { expect } from "chai";
import { Channel } from "../../lib/channel";
import { ChannelSettings } from "../../lib/channel-settings";
import { Graph } from "../../lib/graph";
import { Node } from "../../lib/node";
import { LndSerializer } from "../../lib/serializers/lnd-serializer";

describe("LndSerializer", () => {
    let sut: LndSerializer;

    beforeEach(() => {
        sut = new LndSerializer();
    });

    describe(".toObject()", () => {
        it("should construct a describeGraph equivalent object", () => {
            const graph = new Graph();

            const node1 = new Node();
            node1.alias = Buffer.from("htlc.me");
            node1.lastUpdate = 1521516480;
            node1.nodeId = Buffer.from("02ece82b43452154392772d63c0a244f1592f0d29037c88020118889b76851173f", "hex"); // prettier-ignore
            node1.rgbColor = Buffer.from("3399ff", "hex");
            node1.addresses = [new AddressIPv4("54.236.31.248", 9735)];
            graph.addNode(node1);

            const node2 = new Node();
            node2.alias = Buffer.from("endurance");
            node2.lastUpdate = 1584111068;
            node2.nodeId = Buffer.from("03933884aaf1d6b108397e5efe5c86bcf2d8ca8d2f700eda99db9214fc2712b134", "hex"); // prettier-ignore
            node2.rgbColor = Buffer.from("ffff00", "hex");
            node2.addresses = [
                new AddressIPv4("13.248.222.197", 9735),
                new AddressTor3(
                    "iq7zhmhck54vcax2vlrdcavq2m32wao7ekh6jyeglmnuuvv3js57r4id.onion",
                    9735,
                ),
            ];
            graph.addNode(node2);

            const channel = new Channel();
            channel.shortChannelId = shortChannelIdFromNumber(BigInt("1416385381359943680"));
            channel.channelPoint = OutPoint.fromString("b73b2b1d2c0a5235037991a3cfcf1d722428033c83c95d6394c3962cfe141a37:0"); // prettier-ignore
            channel.nodeId1 = Buffer.from("02ece82b43452154392772d63c0a244f1592f0d29037c88020118889b76851173f", "hex"); // prettier-ignore
            channel.nodeId2 = Buffer.from("03933884aaf1d6b108397e5efe5c86bcf2d8ca8d2f700eda99db9214fc2712b134", "hex"); // prettier-ignore
            channel.capacity = BigInt("15000000");
            channel.node2Settings = new ChannelSettings();
            channel.node2Settings.cltvExpiryDelta = 144;
            channel.node2Settings.htlcMinimumMsat = BigInt(1000);
            channel.node2Settings.feeBaseMsat = 10000;
            channel.node2Settings.feeProportionalMillionths = 100;
            channel.node2Settings.htlcMaximumMsat = BigInt(15000000000);
            channel.node2Settings.timestamp = 1584111074;
            channel.node2Settings.disabled = false;
            graph.addChannel(channel);

            const actual = sut.toObject(graph);
            expect(actual).to.deep.equal({
                nodes: [
                    {
                        last_update: 1521516480,
                        pub_key:
                            "02ece82b43452154392772d63c0a244f1592f0d29037c88020118889b76851173f",
                        alias: "htlc.me",
                        addresses: [
                            {
                                network: "tcp",
                                addr: "54.236.31.248:9735",
                            },
                        ],
                        color: "#3399ff",
                    },
                    {
                        last_update: 1584111068,
                        pub_key:
                            "03933884aaf1d6b108397e5efe5c86bcf2d8ca8d2f700eda99db9214fc2712b134",
                        alias: "endurance",
                        addresses: [
                            {
                                network: "tcp",
                                addr: "13.248.222.197:9735",
                            },
                            {
                                network: "tcp",
                                addr:
                                    "iq7zhmhck54vcax2vlrdcavq2m32wao7ekh6jyeglmnuuvv3js57r4id.onion:9735",
                            },
                        ],
                        color: "#ffff00",
                    },
                ],
                edges: [
                    {
                        channel_id: "1416385381359943680",
                        chan_point:
                            "b73b2b1d2c0a5235037991a3cfcf1d722428033c83c95d6394c3962cfe141a37:0",
                        last_update: 1584111074,
                        node1_pub:
                            "02ece82b43452154392772d63c0a244f1592f0d29037c88020118889b76851173f",
                        node2_pub:
                            "03933884aaf1d6b108397e5efe5c86bcf2d8ca8d2f700eda99db9214fc2712b134",
                        capacity: "15000000",
                        node1_policy: null,
                        node2_policy: {
                            time_lock_delta: 144,
                            min_htlc: "1000",
                            fee_base_msat: "10000",
                            fee_rate_milli_msat: "100",
                            disabled: false,
                            max_htlc_msat: "15000000000",
                            last_update: 1584111074,
                        },
                    },
                ],
            });
        });
    });

    describe("serializeNode", () => {
        it("should serialize node", () => {
            const node = new Node();
            node.alias = Buffer.from("endurance");
            node.lastUpdate = 1584111068;
            node.nodeId = Buffer.from("03933884aaf1d6b108397e5efe5c86bcf2d8ca8d2f700eda99db9214fc2712b134", "hex"); // prettier-ignore
            node.rgbColor = Buffer.from("ffff00", "hex");
            node.addresses = [
                new AddressIPv4("13.248.222.197", 9735),
                new AddressTor3(
                    "iq7zhmhck54vcax2vlrdcavq2m32wao7ekh6jyeglmnuuvv3js57r4id.onion",
                    9735,
                ),
            ];
            const actual = sut.serializeNode(node);
            expect(actual).to.deep.equal({
                last_update: 1584111068,
                pub_key: "03933884aaf1d6b108397e5efe5c86bcf2d8ca8d2f700eda99db9214fc2712b134",
                alias: "endurance",
                addresses: [
                    {
                        network: "tcp",
                        addr: "13.248.222.197:9735",
                    },
                    {
                        network: "tcp",
                        addr: "iq7zhmhck54vcax2vlrdcavq2m32wao7ekh6jyeglmnuuvv3js57r4id.onion:9735",
                    },
                ],
                color: "#ffff00",
            });
        });
    });

    describe("serializeAddress", () => {
        it("should serialize ipv4 address", () => {
            const actual = sut.serializeAddress(new AddressIPv4("13.248.222.197", 9735));
            expect(actual).to.deep.equal({
                network: "tcp",
                addr: "13.248.222.197:9735",
            });
        });

        it("should serialize TOR v2 address", () => {
            const actual = sut.serializeAddress(new AddressTor2("ak5mvsdf7r7oqnc7.onion", 9735));
            expect(actual).to.deep.equal({
                network: "tcp",
                addr: "ak5mvsdf7r7oqnc7.onion:9735",
            });
        });

        it("should serialize tor v3 address", () => {
            const actual = sut.serializeAddress(
                new AddressTor3(
                    "iq7zhmhck54vcax2vlrdcavq2m32wao7ekh6jyeglmnuuvv3js57r4id.onion",
                    9735,
                ),
            );
            expect(actual).to.deep.equal({
                network: "tcp",
                addr: "iq7zhmhck54vcax2vlrdcavq2m32wao7ekh6jyeglmnuuvv3js57r4id.onion:9735",
            });
        });
    });

    describe("serializeChannel", () => {
        it("should serialize channel and settings", () => {
            const channel = new Channel();
            channel.shortChannelId = shortChannelIdFromNumber(BigInt("1406331447018586112"));
            channel.channelPoint = OutPoint.fromString("95d156f882bfd0613b5cff00a1c673799d09afe98847a8e8994824fe6ce5f58a:0"); // prettier-ignore
            channel.capacity = BigInt(5000000);
            channel.nodeId1 = Buffer.from("024213b8128786dec17187b8e1f74df34299c93c38a509e91f8c2c74f375e606a6", "hex"); // prettier-ignore
            channel.nodeId2 = Buffer.from("03f819115fcf762c16dbf5cbaaaf85cbd664bc62b085b5ff283fa31fedca89382d", "hex"); // prettier-ignore
            channel.node1Settings = new ChannelSettings();
            channel.node1Settings.cltvExpiryDelta = 6;
            channel.node1Settings.htlcMinimumMsat = BigInt(0);
            channel.node1Settings.feeBaseMsat = 1;
            channel.node1Settings.feeProportionalMillionths = 10;
            channel.node1Settings.htlcMaximumMsat = BigInt(4294967295);
            channel.node1Settings.timestamp = 1584010110;
            channel.node1Settings.disabled = false;
            channel.node2Settings = new ChannelSettings();
            channel.node2Settings.cltvExpiryDelta = 6;
            channel.node2Settings.htlcMinimumMsat = BigInt(0);
            channel.node2Settings.feeBaseMsat = 1;
            channel.node2Settings.feeProportionalMillionths = 10;
            channel.node2Settings.htlcMaximumMsat = BigInt(4294967295);
            channel.node2Settings.timestamp = 1582911291;
            channel.node2Settings.disabled = false;

            const actual = sut.serializeChannel(channel);

            expect(actual).to.deep.equal({
                channel_id: "1406331447018586112",
                chan_point: "95d156f882bfd0613b5cff00a1c673799d09afe98847a8e8994824fe6ce5f58a:0",
                last_update: 1584010110,
                node1_pub: "024213b8128786dec17187b8e1f74df34299c93c38a509e91f8c2c74f375e606a6",
                node2_pub: "03f819115fcf762c16dbf5cbaaaf85cbd664bc62b085b5ff283fa31fedca89382d",
                capacity: "5000000",
                node1_policy: {
                    time_lock_delta: 6,
                    min_htlc: "0",
                    fee_base_msat: "1",
                    fee_rate_milli_msat: "10",
                    disabled: false,
                    max_htlc_msat: "4294967295",
                    last_update: 1584010110,
                },
                node2_policy: {
                    time_lock_delta: 6,
                    min_htlc: "0",
                    fee_base_msat: "1",
                    fee_rate_milli_msat: "10",
                    disabled: false,
                    max_htlc_msat: "4294967295",
                    last_update: 1582911291,
                },
            });
        });
    });

    describe("serializeRoutingPolicy", () => {
        it("should serialize policy with max_htlc_msat", () => {
            const policy = new ChannelSettings();
            policy.cltvExpiryDelta = 6;
            policy.htlcMinimumMsat = BigInt(0);
            policy.feeBaseMsat = 1;
            policy.feeProportionalMillionths = 10;
            policy.disabled = false;
            policy.htlcMaximumMsat = BigInt(4294967295);
            policy.timestamp = 1582911291;

            const actual = sut.serializeRoutingPolicy(policy);
            expect(actual).to.deep.equal({
                time_lock_delta: 6,
                min_htlc: "0",
                fee_base_msat: "1",
                fee_rate_milli_msat: "10",
                disabled: false,
                max_htlc_msat: "4294967295",
                last_update: 1582911291,
            });
        });

        it("should serialize policy without max_htlc_msat", () => {
            const policy = new ChannelSettings();
            policy.cltvExpiryDelta = 144;
            policy.htlcMinimumMsat = BigInt(1000);
            policy.feeBaseMsat = 1000;
            policy.feeProportionalMillionths = 1;
            policy.disabled = false;
            policy.timestamp = 1540378900;

            const actual = sut.serializeRoutingPolicy(policy);
            expect(actual).to.deep.equal({
                time_lock_delta: 144,
                min_htlc: "1000",
                fee_base_msat: "1000",
                fee_rate_milli_msat: "1",
                disabled: false,
                max_htlc_msat: "0",
                last_update: 1540378900,
            });
        });
    });
});
