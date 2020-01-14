import { BufferCursor } from "@lntools/buffer-cursor";
import { expect } from "chai";
import { TlvStreamReader } from "../../lib/serialize/tlv-stream-reader";
import { N1Type1, N1Type2, N1Type254, N1Type3, N2Type0, N2Type11 } from "./_tlv-types.spec";

function run(recordReader: TlvStreamReader, tests: any[], title: string) {
  for (const test of tests) {
    it(`${title} ${test.input}`, () => {
      const input = Buffer.from(test.input, "hex");
      const reader = new BufferCursor(input);
      const actual = recordReader.read(reader)[0];
      expect(actual ? actual.toJson() : actual).to.deep.equal(test.output);
    });
  }
}

describe("TlvStreamReader", () => {
  describe(".read", () => {
    describe("success vectors", () => {
      describe("n1", () => {
        const tests = [
          { input: "00", output: undefined },
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
        ];

        const n1 = new TlvStreamReader();
        n1.register(N1Type1);
        n1.register(N1Type2);
        n1.register(N1Type3);
        n1.register(N1Type254);
        run(n1, tests, "success test");
      });

      describe("n2", () => {
        const tests = [
          { input: "00", output: undefined },
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
        ];

        const n2 = new TlvStreamReader();
        n2.register(N2Type0);
        n2.register(N2Type11);
        run(n2, tests, "success test");
      });
    });
  });
});
