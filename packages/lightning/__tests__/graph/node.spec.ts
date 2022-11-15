import { ShortChannelId } from "@node-lightning/core";
import { expect } from "chai";
import { Channel } from "../../lib/graph/channel";
import { Node } from "../../lib/graph/node";

describe("Node class", () => {
    describe(".linkChannel", () => {
        it("should add the channel to list of channels", () => {
            const node = new Node();
            const c = new Channel();
            c.shortChannelId = new ShortChannelId(1288457, 3, 0);
            node.linkChannel(c);
            expect(node.channels.size).to.equal(1);
            expect(node.channels.get(c.shortChannelId.toNumber())).to.equal(c);
        });
    });

    describe(".unlinkChannel", () => {
        it("should remove the channel from the list of channels", () => {
            const c1 = new Channel();
            c1.shortChannelId = new ShortChannelId(1288457, 3, 0);

            const c2 = new Channel();
            c2.shortChannelId = new ShortChannelId(1288457, 4, 0);

            const node = new Node();
            node.channels = new Map([
                [new ShortChannelId(1288457, 3, 0).toNumber(), c1],
                [new ShortChannelId(1288457, 4, 0).toNumber(), c2],
            ]);

            node.unlinkChannel(c2);
            expect(node.channels.size).to.equal(1);
            expect(node.channels.get(new ShortChannelId(1288457, 3, 0).toNumber())).to.equal(c1);
        });
    });
});
