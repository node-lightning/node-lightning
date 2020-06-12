// tslint:disable: no-unused-expression
import { expect } from "chai";
import { Channel } from "../lib/channel";
import { ChannelSettings } from "../lib/channel-settings";

describe("Channel class", () => {
    describe(".isRoutable", () => {
        it("should return false by default", () => {
            const channel = new Channel();
            expect(channel.isRoutable).to.be.false;
        });

        it("should return true when nodes and node1 settings", () => {
            const channel = new Channel();
            channel.nodeId1 = Buffer.alloc(32);
            channel.nodeId2 = Buffer.alloc(32);
            channel.node1Settings = new ChannelSettings();
            expect(channel.isRoutable).to.be.true;
        });

        it("should return true when nodes and node2 settings", () => {
            const channel = new Channel();
            channel.nodeId1 = Buffer.alloc(32);
            channel.nodeId2 = Buffer.alloc(32);
            channel.node2Settings = new ChannelSettings();
            expect(channel.isRoutable).to.be.true;
        });

        it("should return true when node and both settings are defined", () => {
            const channel = new Channel();
            channel.nodeId1 = Buffer.alloc(32);
            channel.nodeId2 = Buffer.alloc(32);
            channel.node1Settings = new ChannelSettings();
            channel.node2Settings = new ChannelSettings();
            expect(channel.isRoutable).to.be.true;
        });
    });

    describe(".lastUpdate", () => {
        it("shoulud return 0 when no updates", () => {
            const channel = new Channel();
            expect(channel.lastUpdate).to.equal(0);
        });

        it("should return node1 only", () => {
            const channel = new Channel();
            const s1 = new ChannelSettings();
            s1.direction = 0;
            s1.timestamp = 1;
            channel.updateSettings(s1);

            expect(channel.lastUpdate).to.equal(1);
        });

        it("should return node2 only", () => {
            const channel = new Channel();
            const s1 = new ChannelSettings();
            s1.direction = 1;
            s1.timestamp = 1;
            channel.updateSettings(s1);

            expect(channel.lastUpdate).to.equal(1);
        });

        it("should return max when node1 is higher", () => {
            const channel = new Channel();
            const s1 = new ChannelSettings();
            s1.direction = 0;
            s1.timestamp = 2;
            channel.updateSettings(s1);

            const s2 = new ChannelSettings();
            s2.direction = 1;
            s2.timestamp = 1;
            channel.updateSettings(s2);

            expect(channel.lastUpdate).to.equal(2);
        });

        it("should return max when node2 is higher", () => {
            const channel = new Channel();
            const s1 = new ChannelSettings();
            s1.direction = 0;
            s1.timestamp = 1;
            channel.updateSettings(s1);

            const s2 = new ChannelSettings();
            s2.direction = 1;
            s2.timestamp = 2;
            channel.updateSettings(s2);

            expect(channel.lastUpdate).to.equal(2);
        });
    });

    describe(".updateSettings", () => {
        const testGroups: Array<[string, number, string]> = [
            ["node1", 0, "node1Settings"],
            ["node2", 1, "node2Settings"],
        ];

        for (const [title, direction, channelProp] of testGroups) {
            describe(title, () => {
                let channel: Channel;

                beforeEach(() => {
                    channel = new Channel();
                });

                it("should apply settings when none exist", () => {
                    const s = new ChannelSettings();
                    s.direction = direction;
                    const result = channel.updateSettings(s);
                    expect(result).to.be.true;
                    expect(channel[channelProp]).to.equal(s);
                });

                it("should update settings when newer", () => {
                    const s1 = new ChannelSettings();
                    s1.direction = direction;
                    s1.timestamp = 0;
                    channel.updateSettings(s1);

                    const s2 = new ChannelSettings();
                    s2.direction = direction;
                    s2.timestamp = 1;
                    channel.updateSettings(s2);

                    expect(channel[channelProp]).to.equal(s2);
                });

                it("should ignore settings when older", () => {
                    const s1 = new ChannelSettings();
                    s1.direction = direction;
                    s1.timestamp = 2;
                    channel.updateSettings(s1);

                    const s2 = new ChannelSettings();
                    s2.direction = direction;
                    s2.timestamp = 1;
                    channel.updateSettings(s2);

                    expect(channel[channelProp]).to.equal(s1);
                });
            });
        }
    });
});
