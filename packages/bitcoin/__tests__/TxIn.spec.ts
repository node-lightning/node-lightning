import { StreamReader } from "@node-lightning/bufio";
import { expect } from "chai";
import { HashValue } from "../lib/HashValue";
import { OpCode } from "../lib/OpCodes";
import { Script } from "../lib/Script";
import { TxIn } from "../lib/TxIn";

describe("TxIn", () => {
    describe("#parse()", () => {
        it("should parse", () => {
            const reader = StreamReader.fromHex(
                "56919960ac691763688d3d3bcea9ad6ecaf875df5339e148a1fc61c6ed7a069e" +
                "01000000" +
                "6a" +
                "47304402204585bcdef85e6b1c6af5c2669d4830ff86e42dd205c0e089bc2a821657e951c002201024a10366077f87d6bce1f7100ad8cfa8a064b39d4e8fe4ea13a7b71aa8180f012102f0da57e85eec2934a82a585ea337ce2f4998b50ae699dd79f5880e253dafafb7" +
                "feffffff"
            ); // prettier-ignore
            const sut = TxIn.parse(reader);
            expect(sut.prevTxId).to.deep.equal(
                HashValue.parse(
                    StreamReader.fromHex(
                        "56919960ac691763688d3d3bcea9ad6ecaf875df5339e148a1fc61c6ed7a069e",
                    ),
                ),
            );
            expect(sut.prevTxIndex).to.equal(1);
            expect(
                sut.scriptSig.equals(
                    new Script(
                        Buffer.from(
                            "304402204585bcdef85e6b1c6af5c2669d4830ff86e42dd205c0e089bc2a821657e951c002201024a10366077f87d6bce1f7100ad8cfa8a064b39d4e8fe4ea13a7b71aa8180f01",
                            "hex",
                        ),
                        Buffer.from(
                            "02f0da57e85eec2934a82a585ea337ce2f4998b50ae699dd79f5880e253dafafb7",
                            "hex",
                        ),
                    ),
                ),
            );
            expect(sut.sequence).to.equal(0xfffffffe);
        });
    });

    describe(".serialize()", () => {
        it("should serialize", () => {
            const prevTxId = HashValue.parse(
                StreamReader.fromHex(
                    "56919960ac691763688d3d3bcea9ad6ecaf875df5339e148a1fc61c6ed7a069e",
                ),
            );
            const prevTxIndex = 1;
            const scriptSig = new Script(
                Buffer.from(
                    "304402204585bcdef85e6b1c6af5c2669d4830ff86e42dd205c0e089bc2a821657e951c002201024a10366077f87d6bce1f7100ad8cfa8a064b39d4e8fe4ea13a7b71aa8180f01",
                    "hex",
                ),
                Buffer.from(
                    "02f0da57e85eec2934a82a585ea337ce2f4998b50ae699dd79f5880e253dafafb7",
                    "hex",
                ),
            );
            const sequence = 0xfffffffe;
            const sut = new TxIn(prevTxId, prevTxIndex, scriptSig, sequence);
            expect(sut.serialize().toString("hex")).to.equal(
                "56919960ac691763688d3d3bcea9ad6ecaf875df5339e148a1fc61c6ed7a069e" +
                "01000000" +
                "6a" +
                "47304402204585bcdef85e6b1c6af5c2669d4830ff86e42dd205c0e089bc2a821657e951c002201024a10366077f87d6bce1f7100ad8cfa8a064b39d4e8fe4ea13a7b71aa8180f012102f0da57e85eec2934a82a585ea337ce2f4998b50ae699dd79f5880e253dafafb7" +
                "feffffff"
            ); // prettier-ignore
        });
    });

    describe(".toString()", () => {
        it("output a string", () => {
            const prevTxId = HashValue.parse(
                StreamReader.fromHex(
                    "56919960ac691763688d3d3bcea9ad6ecaf875df5339e148a1fc61c6ed7a069e",
                ),
            );
            const prevTxIndex = 1;
            const scriptSig = new Script(OpCode.OP_4);
            const sequence = 0xfffffffe;
            const sut = new TxIn(prevTxId, prevTxIndex, scriptSig, sequence);
            expect(sut.toString()).to.equal(
                "prev=9e067aedc661fca148e13953df75f8ca6eada9ce3b3d8d68631769ac60999156, prevIdx=1, scriptSig=OP_4, sequence=4294967294",
            );
        });
    });

    describe(".toJSON()", () => {
        it("outputs to object", () => {
            const prevTxId = HashValue.parse(
                StreamReader.fromHex(
                    "56919960ac691763688d3d3bcea9ad6ecaf875df5339e148a1fc61c6ed7a069e",
                ),
            );
            const prevTxIndex = 1;
            const scriptSig = new Script(OpCode.OP_4);
            const sequence = 0xfffffffe;
            const sut = new TxIn(prevTxId, prevTxIndex, scriptSig, sequence);
            const result = sut.toJSON();
            expect(result.prevTxId).to.equal(
                "9e067aedc661fca148e13953df75f8ca6eada9ce3b3d8d68631769ac60999156",
            );
            expect(result.prevTxIndex).to.equal(1);
            expect(result.scriptSig).to.equal("OP_4");
            expect(result.sequence).to.equal(4294967294);
        });
    });
});
