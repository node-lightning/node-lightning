import { StreamReader } from "@node-lightning/bufio";
import { expect } from "chai";
import { HashValue} from "../lib/HashValue";

describe("HashValue", () => {
    describe("#parseRpcOrder()", () => {
        it("throws when short", () => {
            const sr = StreamReader.fromHex("000000000019d6689c085ae165831e934ff763ae46a2a6c172b3f1b60a8ce2");
            expect(() => HashValue.parseRpcOrder(sr)).to.throw();
        });
        it("parses value", () => {
            const sr = StreamReader.fromHex("000000000019d6689c085ae165831e934ff763ae46a2a6c172b3f1b60a8ce26f");
            const val = HashValue.parseRpcOrder(sr);
            expect(val.toString()).to.equal("000000000019d6689c085ae165831e934ff763ae46a2a6c172b3f1b60a8ce26f");
        });
    });

    describe("#parse()", () => {
        it("throw when short", () => {
            const sr = StreamReader.fromHex("6fe28c0ab6f1b372c1a6a246ae63f74f931e8365e15a089c68d61900000000");
            expect(() => HashValue.parse(sr)).to.throw();
        });
        it("parses value", () => {
            const sr = StreamReader.fromHex("6fe28c0ab6f1b372c1a6a246ae63f74f931e8365e15a089c68d6190000000000");
            const val = HashValue.parse(sr);
            expect(val.toString()).to.equal("000000000019d6689c085ae165831e934ff763ae46a2a6c172b3f1b60a8ce26f");
        });
    });

    describe(".toString()", () =>{
        it("returns RPC byte order", () => {
            const val = new HashValue(Buffer.from("6fe28c0ab6f1b372c1a6a246ae63f74f931e8365e15a089c68d6190000000000", "hex"));
            expect(val.toString()).to.equal("000000000019d6689c085ae165831e934ff763ae46a2a6c172b3f1b60a8ce26f");
        });
    });

    describe(".toJSON()", () => {
        it("returns RPC byte order", () => {
            const val = new HashValue(Buffer.from("6fe28c0ab6f1b372c1a6a246ae63f74f931e8365e15a089c68d6190000000000", "hex"));
            expect(val.toJSON()).to.equal("000000000019d6689c085ae165831e934ff763ae46a2a6c172b3f1b60a8ce26f");
        });
    });

    describe(".serialize()", () => {
        it("serializes to internal byte order", () => {
            const val = new HashValue(Buffer.from("6fe28c0ab6f1b372c1a6a246ae63f74f931e8365e15a089c68d6190000000000", "hex"));
            expect(val.serialize().toString("hex")).to.equal("6fe28c0ab6f1b372c1a6a246ae63f74f931e8365e15a089c68d6190000000000");
        });
    });
});
