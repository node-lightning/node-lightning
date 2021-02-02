import { StreamReader } from "@node-lightning/bufio";
import { expect } from "chai";
import { Sequence } from "../lib/Sequence";
import { TimeLockMode } from "../lib/TimeLockMode";

describe("Sequence", () => {
    describe("#.parse()", () => {
        it("should parse", () => {
            const sr = StreamReader.fromHex("feffffff");
            const sut = Sequence.parse(sr);
            expect(sut.value).to.equal(0xfffffffe);
        });
    });

    describe("#.locktime()", () => {
        it("should create nLockTime enabling nSequence", () => {
            expect(Sequence.locktime().value).to.equal(0xffff_fffe);
        });
    });

    describe("#.rbf()", () => {
        it("should create RBF enabling nSequence", () => {
            expect(Sequence.rbf().value).to.equal(0xffff_fffd);
        });
    });

    describe("#.default()", () => {
        it("should create nSequence that is final", () => {
            expect(Sequence.default().value).to.equal(0xffff_ffff);
        });
    });

    describe("#.zero()", () => {
        it("should create nSequence of zero", () => {
            expect(Sequence.zero().value).to.equal(0);
        });
    });

    describe("#.blockDelay()", () => {
        it("should create nSequence with a block delay", () => {
            const sut = Sequence.blockDelay(10);
            expect(sut.enabled).to.equal(true);
            expect(sut.mode).to.equal(TimeLockMode.Block);
            expect(sut.blockDelay).to.equal(10);
        });
    });

    describe("#.timeDelay()", () => {
        it("should create nSequence with a time delay", () => {
            const sut = Sequence.timeDelay(600);
            expect(sut.enabled).to.equal(true);
            expect(sut.mode).to.equal(TimeLockMode.Time);
            expect(sut.timeDelay).to.equal(512 * 2);
        });
    });

    describe(".serialize()", () => {
        it("should serialize", () => {
            const sut = new Sequence(0xfffffffe);
            expect(sut.serialize()).to.deep.equal(Buffer.from([254, 255, 255, 255]));
        });
    });

    describe(".toString()", () => {
        it("should print as hex", () => {
            expect(new Sequence(0xfffffffe).toString()).to.equal("0xfffffffe");
            expect(new Sequence(0x00400003).toString()).to.equal("0x00400003");
            expect(new Sequence(0).toString()).to.equal("0x00000000");
        });
    });

    describe(".toJSON()", () => {
        it("should print as hex", () => {
            expect(new Sequence(0xfffffffe).toJSON()).to.equal("0xfffffffe");
            expect(new Sequence(0x00400003).toJSON()).to.equal("0x00400003");
            expect(new Sequence(0).toJSON()).to.equal("0x00000000");
        });
    });

    describe(".clone()", () => {
        it("clones via deep copy", () => {
            const a = new Sequence(0x00400008);
            const b = a.clone();
            expect(a).to.not.equal(b);
            expect(b.enabled).to.equal(a.enabled);
            expect(b.mode).to.equal(a.mode);
            expect(b.value).to.equal(a.value);
        });
    });

    it("defaults to 0xffff_ffff", () => {
        const sut = new Sequence();
        expect(sut.value).to.equal(0xffff_ffff);
        expect(sut.enabled).to.equal(false);
    });

    it("throws with value below zero", () => {
        expect(() => new Sequence(-1)).to.throw();
    });

    it("throws with value below 0xffff_ffff", () => {
        expect(() => new Sequence(0xffff_ffff_ff));
    });

    it("locked for 4096 seconds", () => {
        const sut = new Sequence(0x00400008);
        expect(sut.enabled).to.equal(true);
        expect(sut.mode).to.equal(TimeLockMode.Time);
        expect(sut.timeDelay).to.equal(4096);
    });

    it("disabled, but non-default value, non-locktime value", () => {
        const sut = new Sequence(0xfedc3210);
        expect(sut.enabled).to.equal(false);
        expect(sut.isDefault).to.equal(false);
    });

    it("locked for 16 blocks", () => {
        const sut = new Sequence(0x00000010);
        expect(sut.enabled).to.equal(true);
        expect(sut.mode).to.equal(TimeLockMode.Block);
        expect(sut.blockDelay).to.equal(16);
    });

    it("disabled, enables locktime", () => {
        const sut = new Sequence(0xfffffffe);
        expect(sut.enabled).to.equal(false);
        expect(sut.value).to.equal(0xfffffffe);
    });

    it("sets time delay and rounds up to nearest 512 second granularity", () => {
        const sut = new Sequence();
        sut.timeDelay = 1500;
        expect(sut.enabled).to.equal(true);
        expect(sut.mode).to.equal(TimeLockMode.Time);
        expect(sut.timeDelay).to.equal(1536);
        expect(sut.value).to.equal(0x0040_0003);
    });

    it("sets block delay", () => {
        const sut = new Sequence();
        sut.blockDelay = 144;
        expect(sut.enabled).to.equal(true);
        expect(sut.mode).to.equal(TimeLockMode.Block);
        expect(sut.blockDelay).to.equal(144);
        expect(sut.value).to.equal(0x0000_0090);
    });

    it("nLockTimeSignaled", () => {
        expect(new Sequence(0xffffffff).isLockTimeSignaled).to.equal(false);
        expect(new Sequence(0xfffffffe).isLockTimeSignaled).to.equal(true);
        expect(new Sequence(0).isLockTimeSignaled).to.equal(true);
    });

    it("rbfSignaled", () => {
        expect(new Sequence(0xffffffff).isRBFSignaled).to.equal(false);
        expect(new Sequence(0xfffffffe).isRBFSignaled).to.equal(false);
        expect(new Sequence(0xfffffffd).isRBFSignaled).to.equal(true);
        expect(new Sequence(0).isRBFSignaled).to.equal(true);
    });
});
