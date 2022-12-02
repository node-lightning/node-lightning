import { LockTime, Sequence } from "@node-lightning/bitcoin";
import { expect } from "chai";
import { CommitmentNumber } from "../../lib/channels/CommitmentNumber";

describe("CommitmentNumber", () => {
    const b = (hex: string) => Buffer.from(hex, "hex");
    const openBasePoint = b("034f355bdcb7cc0af728ef3cceb9615d90684bb5b2ca5f859ab0f0b704075871aa"); // prettier-ignore
    const acceptBasePoint = b("032c0b7cf95324a07d05398b240174dc0c2be444d96b159aa6c7f7b1e668680991"); // prettier-ignore

    describe("#.obscure()", () => {
        it("BOLT3 Test Vector", () => {
            const result = CommitmentNumber.obscure(42, openBasePoint, acceptBasePoint);
            expect(result).to.equal(BigInt(0x2bb038521914) ^ BigInt(42));
        });
    });

    describe("#.getSequence()", () => {
        it("BOLT3 Test Vector", () => {
            const result = CommitmentNumber.getSequence(BigInt(0x2bb03852193e));
            expect(result.serialize().toString("hex")).to.equal("38b02b80");
        });
    });

    describe("#.toLockTime()", () => {
        it("BOLT3 Test Vector", () => {
            const result = CommitmentNumber.getLockTime(BigInt(0x2bb03852193e));
            expect(result.serialize().toString("hex")).to.equal("3e195220");
        });
    });

    describe("#.reveal()", () => {
        it("BOLT3 Test Vector", () => {
            const result = CommitmentNumber.reveal(
                new LockTime(542251326),
                new Sequence(2150346808),
                openBasePoint,
                acceptBasePoint,
            );
            expect(result).to.equal(42);
        });
    });
});
