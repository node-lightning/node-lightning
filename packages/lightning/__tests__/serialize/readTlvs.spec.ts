import { BufferReader } from "@node-lightning/bufio";
import { shortChannelIdFromBuffer } from "../../lib/domain/ShortChannelIdUtils";
import { expect } from "chai";
import { readTlvs } from "../../lib/serialize/readTlvs";

describe(".readTlvs()", () => {
    const n1tests: Array<{ input: string; failure?: string; output?: any }> = [
        {
            input: "fd",
            failure: "type truncated",
        },
        {
            input: "fd01",
            failure: "type truncated",
        },
        {
            input: "fd000100",
            failure: "not minimally encoded",
        },
        {
            input: "fd0101",
            failure: "no length",
        },
        {
            input: "0ffd",
            failure: "length truncated",
        },
        {
            input: "0ffd26",
            failure: "length truncated",
        },
        {
            input: "0ffd2602",
            failure: "missing value",
        },
        {
            input: "0ffd000100",
            failure: "not minimally encoded",
        },
        {
            input: "0ffd0201000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000", // prettier-ignore
            failure: "value truncated",
        },
        {
            input: "1200",
            failure: "unknown even type",
        },
        {
            input: "fd010200",
            failure: "unknown even type",
        },
        {
            input: "fe0100000200",
            failure: "unknow even type",
        },
        {
            input: "ff010000000000000200",
            failure: "unknown even type",
        },
        {
            input: "0109ffffffffffffffffff",
            failure: "greater than encoding length for n1s tlv1",
        },
        {
            input: "010100",
            failure: "encoding for n1s tlv1s amount_msat is not minimal",
        },
        {
            input: "01020001",
            failure: "encoding for n1s tlv1s amount_msat is not minimal",
        },
        {
            input: "0103000100",
            failure: "encoding for n1s tlv1s amount_msat is not minimal",
        },
        {
            input: "010400010000",
            failure: "encoding for n1s tlv1s amount_msat is not minimal",
        },
        {
            input: "01050001000000",
            failure: "encoding for n1s tlv1s amount_msat is not minimal",
        },
        {
            input: "0106000100000000",
            failure: "encoding for n1s tlv1s amount_msat is not minimal",
        },
        {
            input: "010700010000000000",
            failure: "encoding for n1s tlv1s amount_msat is not minimal",
        },
        {
            input: "01080001000000000000",
            failure: "encoding for n1s tlv1s amount_msat is not minimal",
        },
        {
            input: "020701010101010101",
            failure: "less than encoding length for n1s tlv2",
        },
        {
            input: "0209010101010101010101",
            failure: "greater than encoding length for n1s tlv2",
        },
        {
            input: "0321023da092f6980e58d2c037173180e9a465476026ee50f96695963e8efe436f54eb",
            failure: "less than encoding length for n1s tlv3",
        },
        {
            input: "0329023da092f6980e58d2c037173180e9a465476026ee50f96695963e8efe436f54eb0000000000000001", // prettier-ignore
            failure: "less than encoding length for n1s tlv3",
        },
        {
            input: "0330023da092f6980e58d2c037173180e9a465476026ee50f96695963e8efe436f54eb000000000000000100000000000001",
            failure: "less than encoding length for n1s tlv3",
        },
        // {
        //   input: "0331043da092f6980e58d2c037173180e9a465476026ee50f96695963e8efe436f54eb00000000000000010000000000000002", // prettier-ignore
        //   failure: "n1s node_id is not a valid point",
        // },
        {
            input: "0332023da092f6980e58d2c037173180e9a465476026ee50f96695963e8efe436f54eb0000000000000001000000000000000001", // prettier-ignore
            failure: "greater than encoding length for n1s tlv3",
        },
        {
            input: "fd00fe00",
            failure: "less than encoding length for n1s tlv4",
        },
        {
            input: "fd00fe0101",
            failure: "less than encoding length for n1s tlv4",
        },
        {
            input: "fd00fe03010101",
            failure: "greater than encoding length for n1s tlv4",
        },
        {
            input: "0000",
            failure: "unknown even field for n1s namespace",
        },
        {
            input: "",
            output: {},
        },
        {
            input: "2100",
            output: {},
        },
        {
            input: "fd020100",
            output: {},
        },
        {
            input: "fd00fd00",
            output: {},
        },
        {
            input: "fd00ff00",
            output: {},
        },
        {
            input: "fe0200000100",
            output: {},
        },
        {
            input: "ff020000000000000100",
            output: {},
        },
        {
            input: "0100",
            output: { amount_msat: "0" },
        },
        {
            input: "010101",
            output: { amount_msat: "1" },
        },
        {
            input: "01020100",
            output: { amount_msat: "256" },
        },
        {
            input: "0103010000",
            output: { amount_msat: "65536" },
        },
        {
            input: "010401000000",
            output: { amount_msat: "16777216" },
        },
        {
            input: "01050100000000",
            output: { amount_msat: "4294967296" },
        },
        {
            input: "0106010000000000",
            output: { amount_msat: "1099511627776" },
        },
        {
            input: "010701000000000000",
            output: { amount_msat: "281474976710656" },
        },
        {
            input: "01080100000000000000",
            output: { amount_msat: "72057594037927936" },
        },
        {
            input: "02080000000000000226",
            output: { scid: "0x0x550" },
        },
        {
            input: "0331023da092f6980e58d2c037173180e9a465476026ee50f96695963e8efe436f54eb00000000000000010000000000000002", // prettier-ignore
            output: {
                node_id: "023da092f6980e58d2c037173180e9a465476026ee50f96695963e8efe436f54eb",
                amount_msat_1: "1",
                amount_msat_2: "2",
            },
        },
        {
            input: "fd00fe020226",
            output: { cltv_delta: 550 },
        },
        {
            input: "01030100000 2080000000000000226",
            output: {
                amount_msat: "65536",
                scid: "0x0x550",
            },
        },
        {
            input: "02 08 0000000000000226 01 01 2a",
            failure: "valid TLV records but invalid ordering",
        },
        {
            input: "02 08 0000000000000231 02 08 0000000000000451",
            failure: "duplicate TLV type",
        },
        {
            input: "1f 00 0f 01 2a",
            failure: "valid (ignored) TLV records but invalid ordering",
        },
        {
            input: "1f 00 1f 01 2a",
            failure: "duplicate TLV type (ignored)",
        },
    ];

    for (const test of n1tests) {
        it(`n1 ${test.input}`, () => {
            const instance: any = {};
            function handler(type: bigint, value: BufferReader): boolean {
                switch (type) {
                    case BigInt(1): {
                        instance.amount_msat = value.readTUInt64().toString();
                        return true;
                    }

                    case BigInt(2): {
                        const scid = shortChannelIdFromBuffer(value.readBytes(8));
                        instance.scid = scid.toString();
                        return true;
                    }

                    case BigInt(3): {
                        const nodeId = value.readBytes(33);
                        const amountMsat1 = value.readUInt64BE();
                        const amountMsat2 = value.readUInt64BE();
                        instance.node_id = nodeId.toString("hex");
                        instance.amount_msat_1 = amountMsat1.toString();
                        instance.amount_msat_2 = amountMsat2.toString();
                        return true;
                    }

                    case BigInt(254): {
                        instance.cltv_delta = value.readUInt16BE();
                        return true;
                    }
                }
            }
            const input = Buffer.from(test.input.replace(/ /g, ""), "hex");
            const reader = new BufferReader(input);
            if (test.failure) {
                expect(() => readTlvs(reader, handler)).to.throw();
            } else {
                readTlvs(reader, handler);
                expect(instance).to.deep.equal(test.output);
            }
        });
    }

    const n2tests: Array<{ input: string; failure?: string; output?: any }> = [
        {
            input: "fd",
            failure: "type truncated",
        },
        {
            input: "fd01",
            failure: "type truncated",
        },
        {
            input: "fd000100",
            failure: "not minimally encoded",
        },
        {
            input: "fd0101",
            failure: "no length",
        },
        {
            input: "0ffd",
            failure: "length truncated",
        },
        {
            input: "0ffd26",
            failure: "length truncated",
        },
        {
            input: "0ffd2602",
            failure: "missing value",
        },
        {
            input: "0ffd000100",
            failure: "not minimally encoded",
        },
        {
            input: "0ffd0201000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000", // prettier-ignore
            failure: "value truncated",
        },
        {
            input: "1200",
            failure: "unknown even type",
        },
        {
            input: "fd010200",
            failure: "unknown even type",
        },
        {
            input: "fe0100000200",
            failure: "unknow even type",
        },
        {
            input: "ff010000000000000200",
            failure: "unknown even type",
        },
        {
            input: "",
            output: {},
        },
        {
            input: "2100",
            output: {},
        },
        {
            input: "fd020100",
            output: {},
        },
        {
            input: "fd00fd00",
            output: {},
        },
        {
            input: "fd00ff00",
            output: {},
        },
        {
            input: "fe0200000100",
            output: {},
        },
        {
            input: "ff020000000000000100",
            output: {},
        },
        {
            input: "ffffffffffffffffff 00 00 00",
            failure: "valid TLV records but invalid ordering",
        },
    ];

    for (const test of n2tests) {
        it(`n2 ${test.input}`, () => {
            const instance: any = {};
            function handler(type: bigint, value: BufferReader): boolean {
                switch (type) {
                    case BigInt(0): {
                        instance.amount_msat = value.readTUInt64().toString();
                        return true;
                    }

                    case BigInt(11): {
                        instance.cltv_delta = value.readTUInt32();
                        return true;
                    }
                }
            }
            const input = Buffer.from(test.input.replace(/ /g, ""), "hex");
            const reader = new BufferReader(input);
            if (test.failure) {
                expect(() => readTlvs(reader, handler)).to.throw();
            } else {
                readTlvs(reader, handler);
                expect(instance).to.deep.equal(test.output);
            }
        });
    }
});
