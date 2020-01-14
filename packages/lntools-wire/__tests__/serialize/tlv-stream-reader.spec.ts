import { BufferCursor } from "@lntools/buffer-cursor";
import { expect } from "chai";
import { TlvStreamReader } from "../../lib/serialize/tlv-stream-reader";
import { N1Type1, N1Type2, N1Type254, N1Type3, N2Type0, N2Type11 } from "./_tlv-types.spec";

function readRecord(streamReader: TlvStreamReader, tests: any[], title: string) {
  for (const test of tests) {
    it(`${title} ${test.input}`, () => {
      const input = Buffer.from(test.input, "hex");
      const reader = new BufferCursor(input);
      if (test.failure) {
        expect(() => streamReader.readRecord(reader)).to.throw();
      } else {
        const actual = streamReader.readRecord(reader);
        expect(actual ? actual.toJson() : actual).to.deep.equal(test.output);
      }
    });
  }
}

const n1 = new TlvStreamReader();
n1.register(N1Type1);
n1.register(N1Type2);
n1.register(N1Type3);
n1.register(N1Type254);

const n2 = new TlvStreamReader();
n2.register(N2Type0);
n2.register(N2Type11);

describe("TlvStreamReader", () => {
  describe(".readRecord()", () => {
    describe("decoding failure vectors", () => {
      const tests = [
        // general
        { input: "fd", failure: "type truncated" },
        { input: "fd01", failure: "type truncated" },
        { input: "fd000100", failure: "not minimally encoded" },
        { input: "fd0101", failure: "no length" },
        { input: "0ffd", failure: "length truncated" },
        { input: "0ffd26", failure: "length truncated" },
        { input: "0ffd2602", failure: "missing value" },
        { input: "0ffd000100", failure: "not minimally encoded" },
        {
          input:
            "0ffd0201000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
          failure: "value truncated",
        },

        // both
        { input: "1200", failure: "unknown even type" },
        { input: "fd010200", failure: "unknown even type" },
        { input: "fe0100000200", failure: "unknow even type" },
        { input: "ff010000000000000200", failure: "unknown even type" },
      ];
      describe("n1", () => {
        const n1tests = tests.concat([
          { input: "0109ffffffffffffffffff", failure: "greater than encoding length for n1s tlv1" },
          { input: "010100", failure: "encoding for n1s tlv1s amount_msat is not minimal" },
          { input: "01020001", failure: "encoding for n1s tlv1s amount_msat is not minimal" },
          { input: "0103000100", failure: "encoding for n1s tlv1s amount_msat is not minimal" },
          { input: "010400010000", failure: "encoding for n1s tlv1s amount_msat is not minimal" },
          { input: "01050001000000", failure: "encoding for n1s tlv1s amount_msat is not minimal" },
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
          { input: "020701010101010101", failure: "less than encoding length for n1s tlv2" },
          {
            input: "0209010101010101010101",
            failure: "greater than encoding length for n1s tlv2",
          },
          {
            input: "0321023da092f6980e58d2c037173180e9a465476026ee50f96695963e8efe436f54eb",
            failure: "less than encoding length for n1s tlv3",
          },
          {
            input:
              "0329023da092f6980e58d2c037173180e9a465476026ee50f96695963e8efe436f54eb0000000000000001",
            failure: "less than encoding length for n1s tlv3",
          },
          {
            input:
              "0330023da092f6980e58d2c037173180e9a465476026ee50f96695963e8efe436f54eb000000000000000100000000000001",
            failure: "less than encoding length for n1s tlv3",
          },
          // {
          //   input:
          //     "0331043da092f6980e58d2c037173180e9a465476026ee50f96695963e8efe436f54eb00000000000000010000000000000002",
          //   failure: "n1s node_id is not a valid point",
          // },
          {
            input:
              "0332023da092f6980e58d2c037173180e9a465476026ee50f96695963e8efe436f54eb0000000000000001000000000000000001",
            failure: "greater than encoding length for n1s tlv3",
          },
          { input: "fd00fe00", failure: "less than encoding length for n1s tlv4" },
          { input: "fd00fe0101", failure: "less than encoding length for n1s tlv4" },
          { input: "fd00fe03010101", failure: "greater than encoding length for n1s tlv4" },
          { input: "0000", failure: "unknown even field for n1s namespace" },
        ]);

        readRecord(n1, n1tests, "");
      });
      describe("n2", () => {
        readRecord(n2, tests, "");
      });
    });
    describe("success vectors", () => {
      const tests = [
        { input: "", output: undefined },
        { input: "2100", output: undefined },
        { input: "fd020100", output: undefined },
        { input: "fd00fd00", output: undefined },
        { input: "fd00ff00", output: undefined },
        { input: "fe0200000100", output: undefined },
        { input: "ff020000000000000100", output: undefined },

        { input: "0100", output: { amount_msat: "0" } },
        { input: "010101", output: { amount_msat: "1" } },
        { input: "01020100", output: { amount_msat: "256" } },
        { input: "0103010000", output: { amount_msat: "65536" } },
        { input: "010401000000", output: { amount_msat: "16777216" } },
        { input: "01050100000000", output: { amount_msat: "4294967296" } },
        { input: "0106010000000000", output: { amount_msat: "1099511627776" } },
        { input: "010701000000000000", output: { amount_msat: "281474976710656" } },
        { input: "01080100000000000000", output: { amount_msat: "72057594037927936" } },
      ] as any[];
      describe("n1", () => {
        const n1Tests = tests.concat([
          { input: "02080000000000000226", output: { scid: "0x0x550" } },
          {
            input:
              "0331023da092f6980e58d2c037173180e9a465476026ee50f96695963e8efe436f54eb00000000000000010000000000000002",
            output: {
              node_id: "023da092f6980e58d2c037173180e9a465476026ee50f96695963e8efe436f54eb",
              amount_msat_1: "1",
              amount_msat_2: "2",
            },
          },
          { input: "fd00fe020226", output: { cltv_delta: 550 } },
        ]);
        readRecord(n1, n1Tests, "success test");
      });

      describe("n2", () => {
        readRecord(n2, tests, "success test");
      });
    });
  });
});
