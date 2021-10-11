import { expect } from "chai";
import { ExtKeyType, ExtPrivateKey, ExtPublicKey } from "../lib/HdKeys";

describe("ExtPrivateKey", () => {
    function expectEqualXPrv(result: ExtPrivateKey, xprv: string) {
        const exp = ExtPrivateKey.parse(xprv);
        expect(result.version).to.equal(exp.version);
        expect(result.depth).to.equal(exp.depth);
        expect(result.number).to.equal(exp.number);
        expect(result.privateKey.toString("hex")).to.equal(exp.privateKey.toString("hex"));
        expect(result.chainCode.toString("hex")).to.equal(exp.chainCode.toString("hex"));
        expect(result.parentFingerprint.toString("hex")).to.equal(
            exp.parentFingerprint.toString("hex"),
        );
    }

    function expectEqualXPub(result: ExtPublicKey, xpub: string) {
        const exp = ExtPublicKey.parse(xpub);
        expect(result.version).to.equal(exp.version);
        expect(result.depth).to.equal(exp.depth);
        expect(result.number).to.equal(exp.number);
        expect(result.publicKey.toString("hex")).to.equal(exp.publicKey.toString("hex"));
        expect(result.chainCode.toString("hex")).to.equal(exp.chainCode.toString("hex"));
        expect(result.fingerprint.toString("hex")).to.equal(exp.fingerprint.toString("hex"));
    }

    describe("vector 1", () => {
        const seed = Buffer.from("000102030405060708090a0b0c0d0e0f", "hex");
        let master: ExtPrivateKey;

        before(() => {
            master = ExtPrivateKey.deriveMaster(seed, ExtKeyType.MainnetPrivate);
        });

        it("m", () => {
            expectEqualXPrv(
                master,
                "xprv9s21ZrQH143K3QTDL4LXw2F7HEK3wJUD2nW2nRk4stbPy6cq3jPPqjiChkVvvNKmPGJxWUtg6LnF5kejMRNNU3TGtRBeJgk33yuGBxrMPHi",
            );
            expectEqualXPub(
                master.toExtPublicKey(),
                "xpub661MyMwAqRbcFtXgS5sYJABqqG9YLmC4Q1Rdap9gSE8NqtwybGhePY2gZ29ESFjqJoCu1Rupje8YtGqsefD265TMg7usUDFdp6W1EGMcet8",
            );
        });

        it("m/0h", () => {
            const result = master.derivePrivate(2 ** 31);
            expectEqualXPrv(
                result,
                "xprv9uHRZZhk6KAJC1avXpDAp4MDc3sQKNxDiPvvkX8Br5ngLNv1TxvUxt4cV1rGL5hj6KCesnDYUhd7oWgT11eZG7XnxHrnYeSvkzY7d2bhkJ7",
            );
            expectEqualXPub(
                result.toExtPublicKey(),
                "xpub68Gmy5EdvgibQVfPdqkBBCHxA5htiqg55crXYuXoQRKfDBFA1WEjWgP6LHhwBZeNK1VTsfTFUHCdrfp1bgwQ9xv5ski8PX9rL2dZXvgGDnw",
            );
        });

        it("m/0h/1", () => {
            const result = master.derivePrivate(2 ** 31).derivePrivate(1);
            expectEqualXPrv(
                result,
                "xprv9wTYmMFdV23N2TdNG573QoEsfRrWKQgWeibmLntzniatZvR9BmLnvSxqu53Kw1UmYPxLgboyZQaXwTCg8MSY3H2EU4pWcQDnRnrVA1xe8fs",
            );
            expectEqualXPub(
                result.toExtPublicKey(),
                "xpub6ASuArnXKPbfEwhqN6e3mwBcDTgzisQN1wXN9BJcM47sSikHjJf3UFHKkNAWbWMiGj7Wf5uMash7SyYq527Hqck2AxYysAA7xmALppuCkwQ",
            );
        });

        it("m/0h/1/2h", () => {
            const result = master
                .derivePrivate(2 ** 31)
                .derivePrivate(1)
                .derivePrivate(2 ** 31 + 2);
            expectEqualXPrv(
                result,
                "xprv9z4pot5VBttmtdRTWfWQmoH1taj2axGVzFqSb8C9xaxKymcFzXBDptWmT7FwuEzG3ryjH4ktypQSAewRiNMjANTtpgP4mLTj34bhnZX7UiM",
            );
            expectEqualXPub(
                result.toExtPublicKey(),
                "xpub6D4BDPcP2GT577Vvch3R8wDkScZWzQzMMUm3PWbmWvVJrZwQY4VUNgqFJPMM3No2dFDFGTsxxpG5uJh7n7epu4trkrX7x7DogT5Uv6fcLW5",
            );
        });

        it("m/0h/1/2h/2", () => {
            const result = master
                .derivePrivate(2 ** 31)
                .derivePrivate(1)
                .derivePrivate(2 ** 31 + 2)
                .derivePrivate(2);
            expectEqualXPrv(
                result,
                "xprvA2JDeKCSNNZky6uBCviVfJSKyQ1mDYahRjijr5idH2WwLsEd4Hsb2Tyh8RfQMuPh7f7RtyzTtdrbdqqsunu5Mm3wDvUAKRHSC34sJ7in334",
            );
            expectEqualXPub(
                result.toExtPublicKey(),
                "xpub6FHa3pjLCk84BayeJxFW2SP4XRrFd1JYnxeLeU8EqN3vDfZmbqBqaGJAyiLjTAwm6ZLRQUMv1ZACTj37sR62cfN7fe5JnJ7dh8zL4fiyLHV",
            );
        });

        it("m/0h/1/2h/2/1000000000", () => {
            const result = master
                .derivePrivate(2 ** 31)
                .derivePrivate(1)
                .derivePrivate(2 ** 31 + 2)
                .derivePrivate(2)
                .derivePrivate(1000000000);
            expectEqualXPrv(
                result,
                "xprvA41z7zogVVwxVSgdKUHDy1SKmdb533PjDz7J6N6mV6uS3ze1ai8FHa8kmHScGpWmj4WggLyQjgPie1rFSruoUihUZREPSL39UNdE3BBDu76",
            );
            expectEqualXPub(
                result.toExtPublicKey(),
                "xpub6H1LXWLaKsWFhvm6RVpEL9P4KfRZSW7abD2ttkWP3SSQvnyA8FSVqNTEcYFgJS2UaFcxupHiYkro49S8yGasTvXEYBVPamhGW6cFJodrTHy",
            );
        });
    });
});
