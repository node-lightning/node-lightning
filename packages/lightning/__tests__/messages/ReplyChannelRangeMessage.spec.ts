import { ShortChannelId } from "../../lib/domain/ShortChannelId";
import { expect } from "chai";
import { ReplyChannelRangeMessage } from "../../lib/messages/ReplyChannelRangeMessage";

describe("ReplyChannelRangeMessage", () => {
    describe(".deserialize", () => {
        it("raw encoded standard message", () => {
            // reply_channel_range
            // 0108 - type 264
            // 43497fd7f826957108f4a30fd9cec3aeba79972084e90ead01ea330900000000 - chain_hash
            // 0018df30 - first_blocknum 1630000
            // 000007d0 - number_of_blocks 2000
            // 01 - complete true
            // 00a9 - encoded_short_chan_id len 169
            // 00 - encoded (non-zlib)
            // 18e05c0000010000 - short_channel_id (1630300, 1, 0)
            // 18e33a0000020000
            // 18e33a0000030000
            // 18e33a0000040000
            // 18e33a0000050000
            // 18e3ec0000010000
            // 18e5140000030000
            // 18e5140000040000
            // 18e5140000050000
            // 18e5140000060000
            // 18e5140000070000
            // 18e5160000010000
            // 18e5160000020000
            // 18e5160000030000
            // 18e5160000040000
            // 18e5170000060000
            // 18e5180000030000
            // 18e5180000040000
            // 18e5190000010000
            // 18e5190000020000
            // 18e51d0000040000
            const input = Buffer.from(
                "010843497fd7f826957108f4a30fd9cec3aeba79972084e90ead01ea3309000000000018df30000007d00100a90018e05c000001000018e33a000002000018e33a000003000018e33a000004000018e33a000005000018e3ec000001000018e514000003000018e514000004000018e514000005000018e514000006000018e514000007000018e516000001000018e516000002000018e516000003000018e516000004000018e517000006000018e518000003000018e518000004000018e519000001000018e519000002000018e51d0000040000",
                "hex",
            );
            const message = ReplyChannelRangeMessage.deserialize(input);

            expect(message.chainHash.toString("hex")).to.equal(
                "43497fd7f826957108f4a30fd9cec3aeba79972084e90ead01ea330900000000",
            );

            expect(message.firstBlocknum).to.equal(1630000);
            expect(message.numberOfBlocks).to.equal(2000);
            // tslint:disable-next-line: no-unused-expression
            expect(message.fullInformation).to.be.true;

            expect(message.shortChannelIds.length).to.equal(21);

            // first 18e05c0000010000
            expect(message.shortChannelIds[0].block).to.equal(1630300);
            expect(message.shortChannelIds[0].txIdx).to.equal(1);
            expect(message.shortChannelIds[0].voutIdx).to.equal(0);

            // last 18e51d0000040000
            expect(message.shortChannelIds[20].block).to.equal(1631517);
            expect(message.shortChannelIds[20].txIdx).to.equal(4);
            expect(message.shortChannelIds[20].voutIdx).to.equal(0);
        });

        it("raw encoded timestamp tlv message", () => {
            const input = Buffer.from(
                "010843497fd7f826957108f4a30fd9cec3aeba79972084e90ead01ea3309000000000018df30000007d00100a90018e05c000001000018e33a000002000018e33a000003000018e33a000004000018e33a000005000018e3ec000001000018e514000003000018e514000004000018e514000005000018e514000006000018e514000007000018e516000001000018e516000002000018e516000003000018e516000004000018e517000006000018e518000003000018e518000004000018e519000001000018e519000002000018e51d000004000001a9005dfc854d5e1de1bc5e1896e85e1dec6c5e1dfbbe5e1896e85e1df4c55e1896e85e1e01795e1896e85e1df0525e185afa5dfcb9195e1e0aa25dfcb9195e1de1835dfcb9195e1e1d995dfcb8bf5e1de8765e1de9305dfcb8bf5e1de330000000005e1de4065dfcb8dd5e1e35fb000000005e1de8ff5dfcb919000000005e1de8605e13c6f9000000005dfcb9735e1de2435dfcb9cd5e185df05e1de6615dfcb9cd5e1defc05dfcba45",
                "hex",
            );
            // reply_channel_range
            // 0108 - type 264
            // 43497fd7f826957108f4a30fd9cec3aeba79972084e90ead01ea330900000000 - chain_hash
            // 0018df30 - first_blocknum 1630000
            // 000007d0 - number_of_blocks 2000
            // 01 - complete true
            // 00a9 - encoded_short_chan_id len 169
            // 00 - encoded (non-zlib)
            // 18e05c0000010000 - short_channel_id (1630300, 1, 0)
            // 18e33a0000020000
            // 18e33a0000030000
            // 18e33a0000040000
            // 18e33a0000050000
            // 18e3ec0000010000
            // 18e5140000030000
            // 18e5140000040000
            // 18e5140000050000
            // 18e5140000060000
            // 18e5140000070000
            // 18e5160000010000
            // 18e5160000020000
            // 18e5160000030000
            // 18e5160000040000
            // 18e5170000060000
            // 18e5180000030000
            // 18e5180000040000
            // 18e5190000010000
            // 18e5190000020000
            // 18e51d0000040000
            // 01 - tlv type timestamp
            // a9 - tlv length 169
            // 00 - encoding raw
            // 5dfc854d 5e1de1bc - timestamps
            // 5e1896e8 5e1dec6c
            // 5e1dfbbe 5e1896e8
            // 5e1df4c5 5e1896e8
            // 5e1e0179 5e1896e8
            // 5e1df052 5e185afa
            // 5dfcb919 5e1e0aa2
            // 5dfcb919 5e1de183
            // 5dfcb919 5e1e1d99
            // 5dfcb8bf 5e1de876
            // 5e1de930 5dfcb8bf
            // 5e1de330 00000000
            // 5e1de406 5dfcb8dd
            // 5e1e35fb 00000000
            // 5e1de8ff 5dfcb919
            // 00000000 5e1de860
            // 5e13c6f9 00000000
            // 5dfcb973 5e1de243
            // 5dfcb9cd 5e185df0
            // 5e1de661 5dfcb9cd
            // 5e1defc0 5dfcba45
            const message = ReplyChannelRangeMessage.deserialize(input);

            expect(message.chainHash.toString("hex")).to.equal(
                "43497fd7f826957108f4a30fd9cec3aeba79972084e90ead01ea330900000000",
            );

            expect(message.firstBlocknum).to.equal(1630000);
            expect(message.numberOfBlocks).to.equal(2000);
            // tslint:disable-next-line: no-unused-expression
            expect(message.fullInformation).to.be.true;

            expect(message.shortChannelIds.length).to.equal(21);

            // first 18e05c0000010000
            expect(message.shortChannelIds[0].block).to.equal(1630300);
            expect(message.shortChannelIds[0].txIdx).to.equal(1);
            expect(message.shortChannelIds[0].voutIdx).to.equal(0);

            // last 18e51d0000040000
            expect(message.shortChannelIds[20].block).to.equal(1631517);
            expect(message.shortChannelIds[20].txIdx).to.equal(4);
            expect(message.shortChannelIds[20].voutIdx).to.equal(0);

            expect(message.timestamps.length).to.equal(21);
            expect(message.timestamps[0][0]).to.equal(1576830285);
            expect(message.timestamps[0][1]).to.equal(1579016636);
            expect(message.timestamps[20][0]).to.equal(1579020224);
            expect(message.timestamps[20][1]).to.equal(1576843845);
        });

        it("zlib encoded standard message", () => {
            const payload = Buffer.from(
                "010843497fd7f826957108f4a30fd9cec3aeba79972084e90ead01ea3309000000000018e05c000004c201004f01789c2dccc10d80300c4351435b580095f4d0453a0bc323216e0c81d2fcd3931c3b765fd222d933a41513662cee17bdf788bb9bb1e086bb5be9d7f8eb269cbb93be911b7963d7d8f599ff9faf187c",
                "hex",
            );
            // 0108 - type 264
            // 43497fd7f826957108f4a30fd9cec3aeba79972084e90ead01ea330900000000 -- chain_hash
            // 0018e05c - first blocknum 1630300
            // 000004c2 - number_of_blocks 1218
            // 01 - complete true
            // 004f - length 79
            // 01 - zlib encoding
            // 789c2dccc10d80300c4351435b580095f4d0453a0bc323216e0c81d2fcd3931c3b765fd222d933a41513662cee17bdf788bb9bb1e086bb5be9d7f8eb269cbb93be911b7963d7d8f599ff9faf187c

            const msg = ReplyChannelRangeMessage.deserialize(payload);

            expect(msg.type).to.equal(264);
            expect(msg.chainHash.toString("hex")).to.equal(
                "43497fd7f826957108f4a30fd9cec3aeba79972084e90ead01ea330900000000",
            );
            expect(msg.firstBlocknum).to.equal(1630300);
            expect(msg.numberOfBlocks).to.equal(1218);
            // tslint:disable-next-line: no-unused-expression
            expect(msg.fullInformation).to.be.true;

            expect(msg.shortChannelIds.length).to.equal(21);

            // first 18e05c0000010000
            expect(msg.shortChannelIds[0].block).to.equal(1630300);
            expect(msg.shortChannelIds[0].txIdx).to.equal(1);
            expect(msg.shortChannelIds[0].voutIdx).to.equal(0);

            // last 18e51d0000040000
            expect(msg.shortChannelIds[20].block).to.equal(1631517);
            expect(msg.shortChannelIds[20].txIdx).to.equal(4);
            expect(msg.shortChannelIds[20].voutIdx).to.equal(0);
        });

        it("zlib encoded timestamp tlv message", () => {
            const payload = Buffer.from(
                "010843497fd7f826957108f4a30fd9cec3aeba79972084e90ead01ea3309000000000018e05c000004c201004f01789c2dccc10d80300c4351435b580095f4d0453a0bc323216e0c81d2fcd3931c3b765fd222d933a41513662cee17bdf788bb9bb1e086bb5be9d7f8eb269cbb93be911b7963d7d8f599ff9faf187c018701789c8bfdd3ea1b27fb704f9cc4b41771b26f72e2647fef83b0bf1c05d3728c9510fe87a03889a85fb17f764ac6c9712d02d3b20f9b217cd999b17f76ec8f937d511627fbd200c27e6cc0000471b24fd880fcbb7172a6bf21fc17ff417aa0ec8438e1633f416ca058719cec2367207d364e22f6439cecb344305bf6fd81d83fbb5c0152f04c8a",
                "hex",
            );
            // 0108 - type 264
            // 43497fd7f826957108f4a30fd9cec3aeba79972084e90ead01ea330900000000 -- chain_hash
            // 0018e05c - first blocknum 1630300
            // 000004c2 - number_of_blocks 1218
            // 01 - complete true
            // 004f - length 79
            // 01 - zlib encoding
            // 789c2dccc10d80300c4351435b580095f4d0453a0bc323216e0c81d2fcd3931c3b765fd222d933a41513662cee17bdf788bb9bb1e086bb5be9d7f8eb269cbb93be911b7963d7d8f599ff9faf187c
            // 01 - tlv type 1 - timestamps
            // 87 - tlv length 135
            //  01 - encoding type zlib
            //  789c8bfdd3ea1b27fb704f9cc4b41771b26f72e2647fef83b0bf1c05d3728c9510fe87a03889a85fb17f764ac6c9712d02d3b20f9b217cd999b17f76ec8f937d511627fbd200c27e6cc0000471b24fd880fcbb7172a6bf21fc17ff417aa0ec8438e1633f416ca058719cec2367207d364e22f6439cecb344305bf6fd81d83fbb5c0152f04c8a

            const msg = ReplyChannelRangeMessage.deserialize(payload);

            expect(msg.type).to.equal(264);
            expect(msg.chainHash.toString("hex")).to.equal(
                "43497fd7f826957108f4a30fd9cec3aeba79972084e90ead01ea330900000000",
            );
            expect(msg.firstBlocknum).to.equal(1630300);
            expect(msg.numberOfBlocks).to.equal(1218);
            // tslint:disable-next-line: no-unused-expression
            expect(msg.fullInformation).to.be.true;

            expect(msg.shortChannelIds.length).to.equal(21);

            // first 18e05c0000010000
            expect(msg.shortChannelIds[0].block).to.equal(1630300);
            expect(msg.shortChannelIds[0].txIdx).to.equal(1);
            expect(msg.shortChannelIds[0].voutIdx).to.equal(0);

            // last 18e51d0000040000
            expect(msg.shortChannelIds[20].block).to.equal(1631517);
            expect(msg.shortChannelIds[20].txIdx).to.equal(4);
            expect(msg.shortChannelIds[20].voutIdx).to.equal(0);

            expect(msg.timestamps.length).to.equal(21);
            expect(msg.timestamps[0][0]).to.equal(1576830285);
            expect(msg.timestamps[0][1]).to.equal(1579016636);
            expect(msg.timestamps[20][0]).to.equal(1579020224);
            expect(msg.timestamps[20][1]).to.equal(1576843845);
        });

        it("message with timestamps and checksums tlvs", () => {
            const payload = Buffer.from(
                "010843497fd7f826957108f4a30fd9cec3aeba79972084e90ead01ea3309000000000018df30000007d001004f01789c2dccc10d80300c4351435b580095f4d0453a0bc323216e0c81d2fcd3931c3b765fd222d933a41513662cee17bdf788bb9bb1e086bb5be9d7f8eb269cbb93be911b7963d7d8f599ff9faf187c018201789c8bfdd3ea1b276f6c132731ed459cbced9b38f9403b08db3d054247314268c74b711251bf62ffec948c938f5182d0c6cc10ba4c31f6cf8efd71f2362271f2561b206c930d0c400014eb03f2efc6c999fe86f0adea417a206ccb0771c2c77e82d840b162a0798781f4d93889d80f71f2e60fc16c794787d83fbb5c019eec42d803a843cf660e444c75687557813614898dff32107fd253ce731b5c882a803d562649242f4a0d45f146c41447f538f60442d805e346063b19348e63c85fedade928b006c91441b72e0d61bcd092df9e34893fb02f5fd0a8444b31bfebd06e0000000079ce4ae844013b97424cb326000000005114ef729478639700000000f428dd19671d27a900000000643769d1c6b7c9d70d96cb8ff4dfc3a0c05c8f134ba933dc3ee677e34242f2e0",
                "hex",
            );
            // 0108 - type
            // 43497fd7f826957108f4a30fd9cec3aeba79972084e90ead01ea330900000000 - chain_hash
            // 0018df30 - first_blocknum
            // 000007d0 - num_blocks
            // 01 - complete
            // 004f - encoded short_id length (169)
            // 01 - encoding type (zlib)
            // 789c2dccc10d80300c4351435b580095f4d0453a0bc323216e0c81d2fcd3931c3b765fd222d933a41513662cee17bdf788bb9bb1e086bb5be9d7f8eb269cbb93be911b7963d7d8f599ff9faf187c

            // 01 - tlv type 1 (timestamps)
            // 82 - tlv length 130
            // 01 - encoding type (zlib)
            // 789c8bfdd3ea1b276f6c132731ed459cbced9b38f9403b08db3d054247314268c74b711251bf62ffec948c938f5182d0c6cc10ba4c31f6cf8efd71f2362271f2561b206c930d0c400014eb03f2efc6c999fe86f0adea417a206ccb0771c2c77e82d840b162a0798781f4d93889d80f71f2e60fc16c794787d83fbb5c019eec42d8
            //     decoded:
            //     5dfc854d 5e1f333c
            //     5e1896e8 5e1f3dec
            //     5e1f513e 5e1896e8
            //     5e1f4764 5e1896e8
            //     5e1f5a01 5e1896e8
            //     5e1f41d2 5e185afa
            //     5dfcb919 5e1f5c22
            //     5dfcb919 5e1f3303
            //     5dfcb919 5e1f7621
            //     5dfcb8bf 5e1f3c14
            //     5e1f3ab0 5dfcb8bf
            //     5e1f34b0 00000000
            //     5e1f3c8e 5dfcb8dd
            //     5e1e35fb 00000000
            //     5e1f3a7f 5dfcb919
            //     00000000 5e1f39e0
            //     5e13c6f9 00000000
            //     5dfcb973 5e1f33c3
            //     5dfcb9cd 5e185df0
            //     5e1f37e1 5dfcb9cd
            //     5e1f4140 5dfcba45

            // 03 - tlv type 3 (checksums)
            // a8 - tlv length 168
            // 43cf660e 444c7568
            // 75578136 14898dff
            // 32107fd2 53ce731b
            // 5c882a80 3d562649
            // 242f4a0d 45f146c4
            // 1447f538 f60442d8
            // 05e34606 3b19348e
            // 63c85fed ade928b0
            // 06c91441 b72e0d61
            // bcd092df 9e34893f
            // b02f5fd0 a8444b31
            // bfebd06e 00000000
            // 79ce4ae8 44013b97
            // 424cb326 00000000
            // 5114ef72 94786397
            // 00000000 f428dd19
            // 671d27a9 00000000
            // 643769d1 c6b7c9d7
            // 0d96cb8f f4dfc3a0
            // c05c8f13 4ba933dc
            // 3ee677e3 4242f2e0
            const msg = ReplyChannelRangeMessage.deserialize(payload);

            expect(msg.checksums.length).to.equal(21);
            expect(msg.checksums[0][0]).to.equal(0x43cf660e);
            expect(msg.checksums[0][1]).to.equal(0x444c7568);
            expect(msg.checksums[20][0]).to.equal(0x3ee677e3);
            expect(msg.checksums[20][1]).to.equal(0x4242f2e0);
        });
    });

    describe(".serialize", () => {
        it("raw encoded standard message", () => {
            const message = new ReplyChannelRangeMessage();
            message.chainHash = Buffer.from(
                "43497fd7f826957108f4a30fd9cec3aeba79972084e90ead01ea330900000000",
                "hex",
            );
            message.firstBlocknum = 1630000;
            message.numberOfBlocks = 2000;
            message.fullInformation = true;
            message.shortChannelIds.push(new ShortChannelId(1630300, 1, 0)); // 18e05c0000010000
            message.shortChannelIds.push(new ShortChannelId(1631517, 4, 0)); // 18e51d0000040000
            expect(message.serialize(0).toString("hex")).to.equal(
                "010843497fd7f826957108f4a30fd9cec3aeba79972084e90ead01ea3309000000000018df30000007d00100110018e05c000001000018e51d0000040000",
            );
        });

        it("raw encoded timestamp tlv message", () => {
            const message = new ReplyChannelRangeMessage();
            message.chainHash = Buffer.from(
                "43497fd7f826957108f4a30fd9cec3aeba79972084e90ead01ea330900000000",
                "hex",
            );
            message.firstBlocknum = 1630000;
            message.numberOfBlocks = 2000;
            message.fullInformation = true;
            message.shortChannelIds.push(new ShortChannelId(1630300, 1, 0));
            message.shortChannelIds.push(new ShortChannelId(1631034, 2, 0));
            message.shortChannelIds.push(new ShortChannelId(1631034, 3, 0));
            message.shortChannelIds.push(new ShortChannelId(1631034, 4, 0));
            message.shortChannelIds.push(new ShortChannelId(1631034, 5, 0));
            message.shortChannelIds.push(new ShortChannelId(1631212, 1, 0));
            message.shortChannelIds.push(new ShortChannelId(1631508, 3, 0));
            message.shortChannelIds.push(new ShortChannelId(1631508, 4, 0));
            message.shortChannelIds.push(new ShortChannelId(1631508, 5, 0));
            message.shortChannelIds.push(new ShortChannelId(1631508, 6, 0));
            message.shortChannelIds.push(new ShortChannelId(1631508, 7, 0));
            message.shortChannelIds.push(new ShortChannelId(1631510, 1, 0));
            message.shortChannelIds.push(new ShortChannelId(1631510, 2, 0));
            message.shortChannelIds.push(new ShortChannelId(1631510, 3, 0));
            message.shortChannelIds.push(new ShortChannelId(1631510, 4, 0));
            message.shortChannelIds.push(new ShortChannelId(1631511, 6, 0));
            message.shortChannelIds.push(new ShortChannelId(1631512, 3, 0));
            message.shortChannelIds.push(new ShortChannelId(1631512, 4, 0));
            message.shortChannelIds.push(new ShortChannelId(1631513, 1, 0));
            message.shortChannelIds.push(new ShortChannelId(1631513, 2, 0));
            message.shortChannelIds.push(new ShortChannelId(1631517, 4, 0));
            message.timestamps = [
                [1576830285, 1579016636],
                [1578669800, 1579019372],
                [1579023294, 1578669800],
                [1579021509, 1578669800],
                [1579024761, 1578669800],
                [1579020370, 1578654458],
                [1576843545, 1579027106],
                [1576843545, 1579016579],
                [1576843545, 1579031961],
                [1576843455, 1579018358],
                [1579018544, 1576843455],
                [1579017008, 0],
                [1579017222, 1576843485],
                [1579038203, 0],
                [1579018495, 1576843545],
                [0, 1579018336],
                [1578354425, 0],
                [1576843635, 1579016771],
                [1576843725, 1578655216],
                [1579017825, 1576843725],
                [1579020224, 1576843845],
            ];
            expect(message.serialize(0).toString("hex")).to.equal(
                "010843497fd7f826957108f4a30fd9cec3aeba79972084e90ead01ea3309000000000018df30000007d00100a90018e05c000001000018e33a000002000018e33a000003000018e33a000004000018e33a000005000018e3ec000001000018e514000003000018e514000004000018e514000005000018e514000006000018e514000007000018e516000001000018e516000002000018e516000003000018e516000004000018e517000006000018e518000003000018e518000004000018e519000001000018e519000002000018e51d000004000001a9005dfc854d5e1de1bc5e1896e85e1dec6c5e1dfbbe5e1896e85e1df4c55e1896e85e1e01795e1896e85e1df0525e185afa5dfcb9195e1e0aa25dfcb9195e1de1835dfcb9195e1e1d995dfcb8bf5e1de8765e1de9305dfcb8bf5e1de330000000005e1de4065dfcb8dd5e1e35fb000000005e1de8ff5dfcb919000000005e1de8605e13c6f9000000005dfcb9735e1de2435dfcb9cd5e185df05e1de6615dfcb9cd5e1defc05dfcba45",
            );
        });

        it("zlib encoded standard message", () => {
            const message = new ReplyChannelRangeMessage();
            message.chainHash = Buffer.from(
                "43497fd7f826957108f4a30fd9cec3aeba79972084e90ead01ea330900000000",
                "hex",
            );
            message.firstBlocknum = 1630300;
            message.numberOfBlocks = 1218;
            message.fullInformation = true;
            message.shortChannelIds.push(new ShortChannelId(1630300, 1, 0));
            message.shortChannelIds.push(new ShortChannelId(1631034, 2, 0));
            message.shortChannelIds.push(new ShortChannelId(1631034, 3, 0));
            message.shortChannelIds.push(new ShortChannelId(1631034, 4, 0));
            message.shortChannelIds.push(new ShortChannelId(1631034, 5, 0));
            message.shortChannelIds.push(new ShortChannelId(1631212, 1, 0));
            message.shortChannelIds.push(new ShortChannelId(1631508, 3, 0));
            message.shortChannelIds.push(new ShortChannelId(1631508, 4, 0));
            message.shortChannelIds.push(new ShortChannelId(1631508, 5, 0));
            message.shortChannelIds.push(new ShortChannelId(1631508, 6, 0));
            message.shortChannelIds.push(new ShortChannelId(1631508, 7, 0));
            message.shortChannelIds.push(new ShortChannelId(1631510, 1, 0));
            message.shortChannelIds.push(new ShortChannelId(1631510, 2, 0));
            message.shortChannelIds.push(new ShortChannelId(1631510, 3, 0));
            message.shortChannelIds.push(new ShortChannelId(1631510, 4, 0));
            message.shortChannelIds.push(new ShortChannelId(1631511, 6, 0));
            message.shortChannelIds.push(new ShortChannelId(1631512, 3, 0));
            message.shortChannelIds.push(new ShortChannelId(1631512, 4, 0));
            message.shortChannelIds.push(new ShortChannelId(1631513, 1, 0));
            message.shortChannelIds.push(new ShortChannelId(1631513, 2, 0));
            message.shortChannelIds.push(new ShortChannelId(1631517, 4, 0));

            expect(message.serialize(1).toString("hex")).to.equal(
                "010843497fd7f826957108f4a30fd9cec3aeba79972084e90ead01ea3309000000000018e05c000004c201004f01789c2dccc10d80300c4351435b580095f4d0453a0bc323216e0c81d2fcd3931c3b765fd222d933a41513662cee17bdf788bb9bb1e086bb5be9d7f8eb269cbb93be911b7963d7d8f599ff9faf187c",
            );
        });

        it("zlib encoded timestamp tlv message", () => {
            const message = new ReplyChannelRangeMessage();
            message.chainHash = Buffer.from(
                "43497fd7f826957108f4a30fd9cec3aeba79972084e90ead01ea330900000000",
                "hex",
            );
            message.firstBlocknum = 1630300;
            message.numberOfBlocks = 1218;
            message.fullInformation = true;
            message.shortChannelIds.push(new ShortChannelId(1630300, 1, 0));
            message.shortChannelIds.push(new ShortChannelId(1631034, 2, 0));
            message.shortChannelIds.push(new ShortChannelId(1631034, 3, 0));
            message.shortChannelIds.push(new ShortChannelId(1631034, 4, 0));
            message.shortChannelIds.push(new ShortChannelId(1631034, 5, 0));
            message.shortChannelIds.push(new ShortChannelId(1631212, 1, 0));
            message.shortChannelIds.push(new ShortChannelId(1631508, 3, 0));
            message.shortChannelIds.push(new ShortChannelId(1631508, 4, 0));
            message.shortChannelIds.push(new ShortChannelId(1631508, 5, 0));
            message.shortChannelIds.push(new ShortChannelId(1631508, 6, 0));
            message.shortChannelIds.push(new ShortChannelId(1631508, 7, 0));
            message.shortChannelIds.push(new ShortChannelId(1631510, 1, 0));
            message.shortChannelIds.push(new ShortChannelId(1631510, 2, 0));
            message.shortChannelIds.push(new ShortChannelId(1631510, 3, 0));
            message.shortChannelIds.push(new ShortChannelId(1631510, 4, 0));
            message.shortChannelIds.push(new ShortChannelId(1631511, 6, 0));
            message.shortChannelIds.push(new ShortChannelId(1631512, 3, 0));
            message.shortChannelIds.push(new ShortChannelId(1631512, 4, 0));
            message.shortChannelIds.push(new ShortChannelId(1631513, 1, 0));
            message.shortChannelIds.push(new ShortChannelId(1631513, 2, 0));
            message.shortChannelIds.push(new ShortChannelId(1631517, 4, 0));
            message.timestamps = [
                [1576830285, 1579016636],
                [1578669800, 1579019372],
                [1579023294, 1578669800],
                [1579021509, 1578669800],
                [1579024761, 1578669800],
                [1579020370, 1578654458],
                [1576843545, 1579027106],
                [1576843545, 1579016579],
                [1576843545, 1579031961],
                [1576843455, 1579018358],
                [1579018544, 1576843455],
                [1579017008, 0],
                [1579017222, 1576843485],
                [1579038203, 0],
                [1579018495, 1576843545],
                [0, 1579018336],
                [1578354425, 0],
                [1576843635, 1579016771],
                [1576843725, 1578655216],
                [1579017825, 1576843725],
                [1579020224, 1576843845],
            ];
            expect(message.serialize(1).toString("hex")).to.equal(
                "010843497fd7f826957108f4a30fd9cec3aeba79972084e90ead01ea3309000000000018e05c000004c201004f01789c2dccc10d80300c4351435b580095f4d0453a0bc323216e0c81d2fcd3931c3b765fd222d933a41513662cee17bdf788bb9bb1e086bb5be9d7f8eb269cbb93be911b7963d7d8f599ff9faf187c018701789c8bfdd3ea1b27fb704f9cc4b41771b26f72e2647fef83b0bf1c05d3728c9510fe87a03889a85fb17f764ac6c9712d02d3b20f9b217cd999b17f76ec8f937d511627fbd200c27e6cc0000471b24fd880fcbb7172a6bf21fc17ff417aa0ec8438e1633f416ca058719cec2367207d364e22f6439cecb344305bf6fd81d83fbb5c0152f04c8a",
            );
        });

        it("message with timestamp and checksum tlvs", () => {
            const message = new ReplyChannelRangeMessage();
            message.chainHash = Buffer.from(
                "43497fd7f826957108f4a30fd9cec3aeba79972084e90ead01ea330900000000",
                "hex",
            );
            message.firstBlocknum = 1630000;
            message.numberOfBlocks = 2000;
            message.fullInformation = true;
            message.shortChannelIds.push(new ShortChannelId(1630300, 1, 0)); // 18e05c0000010000
            message.shortChannelIds.push(new ShortChannelId(1631517, 4, 0)); // 18e51d0000040000
            message.checksums.push([1, 2], [3, 4]);
            expect(message.serialize(0).toString("hex")).to.equal(
                "010843497fd7f826957108f4a30fd9cec3aeba79972084e90ead01ea3309000000000018df30000007d00100110018e05c000001000018e51d0000040000031000000001000000020000000300000004",
            );
        });
    });
});
