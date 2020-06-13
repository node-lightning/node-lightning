import { expect } from "chai";
import * as key from "../lib/key";
import * as s256 from "../lib/secp256k1";

describe("secp256k1", () => {
    describe(".pointAdd()", () => {
        it("point addition", () => {
            const s1 = Buffer.alloc(32, 1);
            const p1 = key.getPublicKey(s1, true);

            const s2 = Buffer.alloc(32, 2);
            const p2 = key.getPublicKey(s2, true);

            const p3 = s256.pointAdd([p1, p2], true);
            expect(p3.toString("hex")).to.equal(
                "02531fe6068134503d2723133227c867ac8fa6c83c537e9a44c3c5bdbdcb1fe337",
            );
        });
    });

    describe(".scalarMul()", () => {
        it("scalar multply", () => {
            const s1 = Buffer.alloc(32, 1);
            const p1 = key.getPublicKey(s1, true);

            const scalar = Buffer.alloc(32);
            scalar[0] = 1;

            const p3 = s256.scalarMul(p1, scalar, true);
            expect(p3.toString("hex")).to.equal(
                "02e116903cfc4d471d4b6662098264ee0334f5f3e08db330cd2380dd9e7d51bab1",
            );
        });
    });

    describe(".privateKeyAdd", () => {
        it("adds", () => {
            const s1 = Buffer.alloc(32, 1);
            const tweak = Buffer.alloc(32);
            tweak[0] = 1;
            const s2 = s256.privateKeyAdd(s1, tweak);
            expect(s2.toString("hex")).to.equal(
                "0201010101010101010101010101010101010101010101010101010101010101",
            );
        });
    });

    describe(".privateKeyMul", () => {
        it("multiplies", () => {
            const s1 = Buffer.alloc(32, 1);
            const tweak = Buffer.alloc(32);
            tweak[tweak.length - 1] = 2;
            const s2 = s256.privateKeyMul(s1, tweak);
            expect(s2.toString("hex")).to.equal(
                "0202020202020202020202020202020202020202020202020202020202020202",
            );
        });
    });
});
