import { expect } from "chai";
import { NoiseState } from "../lib/noise-state";

describe("NoiseState", () => {
    describe("initiator", () => {
        const rs = Buffer.from("028d7500dd4c12685d1f568b4c2b5048e8534b873319f3a8daa612b469132ec7f7", "hex"); // prettier-ignore
        const ls = Buffer.from("1111111111111111111111111111111111111111111111111111111111111111", "hex"); // prettier-ignore
        const es = Buffer.from("1212121212121212121212121212121212121212121212121212121212121212", "hex"); // prettier-ignore
        let sut = new NoiseState({ ls, es });

        const sent = [
            Buffer.from(
                "cf2b30ddf0cf3f80e7c35a6e6730b59fe802473180f396d88a8fb0db8cbcf25d2f214cf9ea1d95",
                "hex",
            ),
        ];

        describe("act 1", () => {
            let m;
            before(() => {
                m = sut.initiatorAct1(rs);
            });
            it("should set the hash correctly", () => {
                expect(sut.h.toString("hex")).to.deep.equal(
                    "9d1ffbb639e7e20021d9259491dc7b160aab270fb1339ef135053f6f2cebe9ce",
                );
            });
            it("should have the correct output", () => {
                expect(m.toString("hex")).to.deep.equal(
                    "00036360e856310ce5d294e8be33fc807077dc56ac80d95d9cd4ddbd21325eff73f70df6086551151f58b8afe6c195782c6a",
                );
            });
        });

        describe("act2", () => {
            before(() => {
                const input = Buffer.from(
                    "0002466d7fcae563e5cb09a0d1870bb580344804617879a14949cf22285f1bae3f276e2470b93aac583c9ef6eafca3f730ae",
                    "hex",
                );
                sut.initiatorAct2(input);
            });
            it("should set the hash correctly", () => {
                expect(sut.h.toString("hex")).to.deep.equal(
                    "90578e247e98674e661013da3c5c1ca6a8c8f48c90b485c0dfa1494e23d56d72",
                );
            });
        });

        describe("act3", () => {
            let m;
            before(() => {
                m = sut.initiatorAct3();
            });
            it("should have the correct output", () => {
                expect(m.toString("hex")).to.deep.equal(
                    "00b9e3a702e93e3a9948c2ed6e5fd7590a6e1c3a0344cfc9d5b57357049aa22355361aa02e55a8fc28fef5bd6d71ad0c38228dc68b1c466263b47fdf31e560e139ba",
                );
            });
            it("should have the correct shared key", () => {
                expect(sut.rk.toString("hex")).to.deep.equal(
                    "bb9020b8965f4df047e07f955f3c4b88418984aadc5cdb35096b9ea8fa5c3442",
                );
            });
            it("should have the correct shared key", () => {
                expect(sut.sk.toString("hex")).to.deep.equal(
                    "969ab31b4d288cedf6218839b27a3e2140827047f2c0f01bf5c04435d43511a9",
                );
            });
        });

        describe("send messages", () => {
            it("should encrypt message properly", () => {
                const m = sut.encryptMessage(Buffer.from("68656c6c6f", "hex"));
                expect(m.toString("hex")).to.deep.equal(
                    "cf2b30ddf0cf3f80e7c35a6e6730b59fe802473180f396d88a8fb0db8cbcf25d2f214cf9ea1d95",
                );
            });

            it("should rotate the sending nonce", () => {
                expect(sut.sn.toString("hex")).to.deep.equal("000000000200000000000000");
            });

            it("should rotate keys correctly", () => {
                const input = Buffer.from("68656c6c6f", "hex");
                for (let i = 1; i < 1001; i++) {
                    const m = sut.encryptMessage(input);
                    sent.push(m);
                    const tests = {
                        1: "72887022101f0b6753e0c7de21657d35a4cb2a1f5cde2650528bbc8f837d0f0d7ad833b1a256a1",
                        500: "178cb9d7387190fa34db9c2d50027d21793c9bc2d40b1e14dcf30ebeeeb220f48364f7a4c68bf8",
                        501: "1b186c57d44eb6de4c057c49940d79bb838a145cb528d6e8fd26dbe50a60ca2c104b56b60e45bd",
                        1000: "4a2f3cc3b5e78ddb83dcb426d9863d9d9a723b0337c89dd0b005d89f8d3c05c52b76b29b740f09",
                        1001: "2ecd8c8a5629d0d02ab457a0fdd0f7b90a192cd46be5ecb6ca570bfc5e268338b1a16cf4ef2d36",
                    };
                    if (tests[i]) {
                        expect(m.toString("hex")).to.deep.equal(tests[i], "failed on message " + i);
                    }
                }
            });
        });

        describe("receive messages", () => {
            before(() => {
                sut = new NoiseState({ ls, es });
                sut.initiatorAct1(rs);
                sut.initiatorAct2(
                    Buffer.from(
                        "0002466d7fcae563e5cb09a0d1870bb580344804617879a14949cf22285f1bae3f276e2470b93aac583c9ef6eafca3f730ae",
                        "hex",
                    ),
                );
                sut.initiatorAct3();
                // swap rk and sk to allow for "receiving"
                sut.rk = sut.sk;
            });

            it("should decrypt the length", () => {
                const l = sut.decryptLength(sent[0].slice(0, 18));
                expect(l).to.deep.equal(5);
            });

            it("should decrypt the message", () => {
                const m = sut.decryptMessage(sent[0].slice(18));
                expect(m.toString()).to.deep.equal("hello");
            });

            it("should rotate keys correctly", () => {
                for (let i = 1; i < 1001; i++) {
                    const l = sut.decryptLength(sent[i].slice(0, 18));
                    const m = sut.decryptMessage(sent[i].slice(18));

                    expect(l).to.deep.equal(5, "failed on message" + i);
                    expect(m.toString()).to.deep.equal("hello", "failed on message" + i);
                }
            });
        });

        describe("with errors", () => {
            it("transport-initiator act2 short read test", () => {
                sut = new NoiseState({ ls, es });
                sut.initiatorAct1(rs);
                const input = Buffer.from(
                    "0002466d7fcae563e5cb09a0d1870bb580344804617879a14949cf22285f1bae3f276e2470b93aac583c9ef6eafca3f730",
                    "hex",
                );
                expect(() => sut.initiatorAct2(input)).to.throw("ACT2_READ_FAILED");
            });

            it("transport-initiator act2 bad version test", () => {
                sut = new NoiseState({ ls, es });
                sut.initiatorAct1(rs);
                const input = Buffer.from(
                    "0102466d7fcae563e5cb09a0d1870bb580344804617879a14949cf22285f1bae3f276e2470b93aac583c9ef6eafca3f730ae",
                    "hex",
                );
                expect(() => sut.initiatorAct2(input)).to.throw("ACT2_BAD_VERSION");
            });

            it("transport-initiator act2 bad key serialization test", () => {
                sut = new NoiseState({ ls, es });
                sut.initiatorAct1(rs);
                const input = Buffer.from(
                    "0004466d7fcae563e5cb09a0d1870bb580344804617879a14949cf22285f1bae3f276e2470b93aac583c9ef6eafca3f730ae",
                    "hex",
                );
                expect(() => sut.initiatorAct2(input)).to.throw();
            });

            it("transport-initiator act2 bad MAC test", () => {
                sut = new NoiseState({ ls, es });
                sut.initiatorAct1(rs);
                const input = Buffer.from(
                    "0002466d7fcae563e5cb09a0d1870bb580344804617879a14949cf22285f1bae3f276e2470b93aac583c9ef6eafca3f730af",
                    "hex",
                );
                expect(() => sut.initiatorAct2(input)).to.throw("unable to authenticate");
            });
        });
    });

    describe("responder", () => {
        const ls = Buffer.from("2121212121212121212121212121212121212121212121212121212121212121", "hex"); // prettier-ignore
        const es = Buffer.from("2222222222222222222222222222222222222222222222222222222222222222", "hex"); // prettier-ignore
        let sut;
        const sent = [];

        describe("act 1", () => {
            before(() => {
                sut = new NoiseState({ ls, es });
                const input = Buffer.from(
                    "00036360e856310ce5d294e8be33fc807077dc56ac80d95d9cd4ddbd21325eff73f70df6086551151f58b8afe6c195782c6a",
                    "hex",
                );
                sut.receiveAct1(input);
            });
            it("should setup hash", () => {
                expect(sut.h.toString("hex")).to.equal(
                    "9d1ffbb639e7e20021d9259491dc7b160aab270fb1339ef135053f6f2cebe9ce",
                );
            });
        });

        describe("act 2", () => {
            let m;
            before(() => {
                m = sut.recieveAct2();
            });
            it("should setup hash", () => {
                expect(sut.h.toString("hex")).to.equal(
                    "90578e247e98674e661013da3c5c1ca6a8c8f48c90b485c0dfa1494e23d56d72",
                );
            });
            it("should return correct message", () => {
                expect(m.toString("hex")).to.equal(
                    "0002466d7fcae563e5cb09a0d1870bb580344804617879a14949cf22285f1bae3f276e2470b93aac583c9ef6eafca3f730ae",
                );
            });
        });

        describe("act 3", () => {
            before(() => {
                const input = Buffer.from(
                    "00b9e3a702e93e3a9948c2ed6e5fd7590a6e1c3a0344cfc9d5b57357049aa22355361aa02e55a8fc28fef5bd6d71ad0c38228dc68b1c466263b47fdf31e560e139ba",
                    "hex",
                );
                sut.receiveAct3(input);
            });
            it("should have correct rk", () => {
                expect(sut.rk.toString("hex")).to.equal(
                    "969ab31b4d288cedf6218839b27a3e2140827047f2c0f01bf5c04435d43511a9",
                );
            });
            it("should have correct sk", () => {
                expect(sut.sk.toString("hex")).to.equal(
                    "bb9020b8965f4df047e07f955f3c4b88418984aadc5cdb35096b9ea8fa5c3442",
                );
            });
            it("should have the remote pub key", () => {
                expect(sut.rpk.toString("hex")).to.equal(
                    "034f355bdcb7cc0af728ef3cceb9615d90684bb5b2ca5f859ab0f0b704075871aa",
                );
            });
        });

        describe("send messages", () => {
            before(() => {
                sut = new NoiseState({ ls, es });
                sut.receiveAct1(
                    Buffer.from(
                        "00036360e856310ce5d294e8be33fc807077dc56ac80d95d9cd4ddbd21325eff73f70df6086551151f58b8afe6c195782c6a",
                        "hex",
                    ),
                );
                sut.recieveAct2();
                sut.receiveAct3(
                    Buffer.from(
                        "00b9e3a702e93e3a9948c2ed6e5fd7590a6e1c3a0344cfc9d5b57357049aa22355361aa02e55a8fc28fef5bd6d71ad0c38228dc68b1c466263b47fdf31e560e139ba",
                        "hex",
                    ),
                );

                // send sending key to same as receiving key so both can be used for same messages
                sut.sk = sut.rk;
            });

            it("should encrypt message properly", () => {
                const m = sut.encryptMessage(Buffer.from("68656c6c6f", "hex"));
                expect(m.toString("hex")).to.deep.equal(
                    "cf2b30ddf0cf3f80e7c35a6e6730b59fe802473180f396d88a8fb0db8cbcf25d2f214cf9ea1d95",
                );
                sent.push(
                    Buffer.from(
                        "cf2b30ddf0cf3f80e7c35a6e6730b59fe802473180f396d88a8fb0db8cbcf25d2f214cf9ea1d95",
                        "hex",
                    ),
                );
            });

            it("should rotate the sending nonce", () => {
                expect(sut.sn.toString("hex")).to.deep.equal("000000000200000000000000");
            });

            it("should rotate keys correctly", () => {
                const input = Buffer.from("68656c6c6f", "hex");
                for (let i = 1; i < 1001; i++) {
                    const m = sut.encryptMessage(input);
                    sent.push(m);
                    const tests = {
                        1: "72887022101f0b6753e0c7de21657d35a4cb2a1f5cde2650528bbc8f837d0f0d7ad833b1a256a1",
                        500: "178cb9d7387190fa34db9c2d50027d21793c9bc2d40b1e14dcf30ebeeeb220f48364f7a4c68bf8",
                        501: "1b186c57d44eb6de4c057c49940d79bb838a145cb528d6e8fd26dbe50a60ca2c104b56b60e45bd",
                        1000: "4a2f3cc3b5e78ddb83dcb426d9863d9d9a723b0337c89dd0b005d89f8d3c05c52b76b29b740f09",
                        1001: "2ecd8c8a5629d0d02ab457a0fdd0f7b90a192cd46be5ecb6ca570bfc5e268338b1a16cf4ef2d36",
                    };
                    if (tests[i]) {
                        expect(m.toString("hex")).to.deep.equal(tests[i], "failed on message " + i);
                    }
                }
            });
        });

        describe("receive messages", () => {
            before(() => {
                sut = new NoiseState({ ls, es });
                sut.receiveAct1(
                    Buffer.from(
                        "00036360e856310ce5d294e8be33fc807077dc56ac80d95d9cd4ddbd21325eff73f70df6086551151f58b8afe6c195782c6a",
                        "hex",
                    ),
                );
                sut.recieveAct2();
                sut.receiveAct3(
                    Buffer.from(
                        "00b9e3a702e93e3a9948c2ed6e5fd7590a6e1c3a0344cfc9d5b57357049aa22355361aa02e55a8fc28fef5bd6d71ad0c38228dc68b1c466263b47fdf31e560e139ba",
                        "hex",
                    ),
                );
            });
            it("should decrypt the length", () => {
                const l = sut.decryptLength(sent[0].slice(0, 18));
                expect(l).to.deep.equal(5);
            });

            it("should decrypt the message", () => {
                const m = sut.decryptMessage(sent[0].slice(18));
                expect(m.toString()).to.deep.equal("hello");
            });

            it("should rotate keys correctly", () => {
                for (let i = 1; i < 1001; i++) {
                    const l = sut.decryptLength(sent[i].slice(0, 18));
                    const m = sut.decryptMessage(sent[i].slice(18));

                    expect(l).to.deep.equal(5, "failed on message" + i);
                    expect(m.toString()).to.deep.equal("hello", "failed on message" + i);
                }
            });
        });

        describe("with errors", () => {
            it("transport-responder act1 short read test", () => {
                sut = new NoiseState({ ls, es });
                const input = Buffer.from(
                    "00036360e856310ce5d294e8be33fc807077dc56ac80d95d9cd4ddbd21325eff73f70df6086551151f58b8afe6c195782c",
                );
                expect(() => sut.receiveAct1(input)).to.throw("ACT1_READ_FAILED");
            });

            it("transport-responder act1 bad version test", () => {
                sut = new NoiseState({ ls, es });
                const input = Buffer.from(
                    "01036360e856310ce5d294e8be33fc807077dc56ac80d95d9cd4ddbd21325eff73f70df6086551151f58b8afe6c195782c6a",
                    "hex",
                );
                expect(() => sut.receiveAct1(input)).to.throw("ACT1_BAD_VERSION");
            });

            it("transport-responder act1 bad key serialization test", () => {
                sut = new NoiseState({ ls, es });
                const input = Buffer.from(
                    "00046360e856310ce5d294e8be33fc807077dc56ac80d95d9cd4ddbd21325eff73f70df6086551151f58b8afe6c195782c6a",
                    "hex",
                );
                expect(() => sut.receiveAct1(input)).to.throw();
            });

            it("transport-responder act1 bad MAC test", () => {
                sut = new NoiseState({ ls, es });
                const input = Buffer.from(
                    "00036360e856310ce5d294e8be33fc807077dc56ac80d95d9cd4ddbd21325eff73f70df6086551151f58b8afe6c195782c6b",
                    "hex",
                );
                expect(() => sut.receiveAct1(input)).to.throw("unable to authenticate");
            });

            it("transport-responder act3 bad version test", () => {
                sut = new NoiseState({ ls, es });
                sut.receiveAct1(
                    Buffer.from(
                        "00036360e856310ce5d294e8be33fc807077dc56ac80d95d9cd4ddbd21325eff73f70df6086551151f58b8afe6c195782c6a",
                        "hex",
                    ),
                );
                sut.recieveAct2();
                expect(() =>
                    sut.receiveAct3(
                        Buffer.from(
                            "01b9e3a702e93e3a9948c2ed6e5fd7590a6e1c3a0344cfc9d5b57357049aa22355361aa02e55a8fc28fef5bd6d71ad0c38228dc68b1c466263b47fdf31e560e139ba",
                            "hex",
                        ),
                    ),
                ).to.throw("ACT3_BAD_VERSION");
            });

            it("transport-responder act3 short read test", () => {
                sut = new NoiseState({ ls, es });
                sut.receiveAct1(
                    Buffer.from(
                        "00036360e856310ce5d294e8be33fc807077dc56ac80d95d9cd4ddbd21325eff73f70df6086551151f58b8afe6c195782c6a",
                        "hex",
                    ),
                );
                sut.recieveAct2();
                expect(() =>
                    sut.receiveAct3(
                        Buffer.from(
                            "00b9e3a702e93e3a9948c2ed6e5fd7590a6e1c3a0344cfc9d5b57357049aa22355361aa02e55a8fc28fef5bd6d71ad0c38228dc68b1c466263b47fdf31e560e139",
                            "hex",
                        ),
                    ),
                ).to.throw("ACT3_READ_FAILED");
            });

            it("transport-responder act3 bad MAC for ciphertext test", () => {
                sut = new NoiseState({ ls, es });
                sut.receiveAct1(
                    Buffer.from(
                        "00036360e856310ce5d294e8be33fc807077dc56ac80d95d9cd4ddbd21325eff73f70df6086551151f58b8afe6c195782c6a",
                        "hex",
                    ),
                );
                sut.recieveAct2();
                expect(() =>
                    sut.receiveAct3(
                        Buffer.from(
                            "00c9e3a702e93e3a9948c2ed6e5fd7590a6e1c3a0344cfc9d5b57357049aa22355361aa02e55a8fc28fef5bd6d71ad0c38228dc68b1c466263b47fdf31e560e139ba",
                            "hex",
                        ),
                    ),
                ).to.throw("unable to authenticate");
            });

            it("transport-responder act3 bad rs test", () => {
                sut = new NoiseState({ ls, es });
                sut.receiveAct1(
                    Buffer.from(
                        "00036360e856310ce5d294e8be33fc807077dc56ac80d95d9cd4ddbd21325eff73f70df6086551151f58b8afe6c195782c6a",
                        "hex",
                    ),
                );
                sut.recieveAct2();
                expect(() =>
                    sut.receiveAct3(
                        Buffer.from(
                            "00bfe3a702e93e3a9948c2ed6e5fd7590a6e1c3a0344cfc9d5b57357049aa2235536ad09a8ee351870c2bb7f78b754a26c6cef79a98d25139c856d7efd252c2ae73c",
                            "hex",
                        ),
                    ),
                ).to.throw();
            });

            it("transport-responder act3 bad MAC test", () => {
                sut = new NoiseState({ ls, es });
                sut.receiveAct1(
                    Buffer.from(
                        "00036360e856310ce5d294e8be33fc807077dc56ac80d95d9cd4ddbd21325eff73f70df6086551151f58b8afe6c195782c6a",
                        "hex",
                    ),
                );
                sut.recieveAct2();
                expect(() =>
                    sut.receiveAct3(
                        Buffer.from(
                            "00b9e3a702e93e3a9948c2ed6e5fd7590a6e1c3a0344cfc9d5b57357049aa22355361aa02e55a8fc28fef5bd6d71ad0c38228dc68b1c466263b47fdf31e560e139bb",
                            "hex",
                        ),
                    ),
                ).to.throw("unable to authenticate");
            });
        });
    });
});
