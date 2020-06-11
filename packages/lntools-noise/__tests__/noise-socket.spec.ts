// tslint:disable: no-unused-expression
import { expect } from "chai";
import { Socket } from "net";
import sinon from "sinon";
import { NoiseSocket } from "../lib/noise-socket";
import { NoiseState } from "../lib/noise-state";
import { READ_STATE } from "../lib/read-state";

// These are low value unit tests that mostly assert implementation details.
// Need to add better tests that assert the NoiseSocket state transitions
// via a mocked socket or actual integration tests.
describe("NoiseSocket", () => {
    let sandbox;
    let noiseState: sinon.SinonStubbedInstance<NoiseState>;
    let socket: sinon.SinonStubbedInstance<Socket>;

    beforeEach(() => {
        sandbox = sinon.createSandbox();
        noiseState = sandbox.createStubInstance(NoiseState);
        socket = sandbox.createStubInstance(Socket);
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe(".end", () => {
        it("should call end on the socket", () => {
            const sut = new NoiseSocket({ socket: socket as any, noiseState: noiseState as any });
            sut.end();
            expect(socket.end.called).to.be.true;
        });
        it("should return the instance", () => {
            const sut = new NoiseSocket({ socket: socket as any, noiseState: noiseState as any });
            expect(sut.end()).to.equal(sut);
        });
    });

    describe(".destroy", () => {
        it("should call destroy on the socket", () => {
            const sut = new NoiseSocket({ socket: socket as any, noiseState: noiseState as any });
            sut.destroy();
            expect(socket.destroy.called).to.be.true;
        });
        it("should call destroy on the socket with the error", () => {
            const sut = new NoiseSocket({ socket: socket as any, noiseState: noiseState as any });
            const err = new Error();
            sut.destroy(err);
            expect(socket.destroy.args[0][0]).to.equal(err);
        });
        it("should return the instance", () => {
            const sut = new NoiseSocket({ socket: socket as any, noiseState: noiseState as any });
            expect(sut.destroy()).to.equal(sut);
        });
    });

    describe("._connected", () => {
        describe("when initiator", () => {
            it("should send initialize the handshake", () => {
                const sut = new NoiseSocket({
                    socket: socket as any,
                    noiseState: noiseState as any,
                    rpk: Buffer.alloc(33),
                });
                sandbox.stub(sut, "_initiateHandshake");
                (sut as any)._onConnected();
                expect((sut as any)._initiateHandshake.called).to.be.true;
            });

            it("should terminate on act1 message generation failure", () => {
                const sut = new NoiseSocket({
                    socket: socket as any,
                    noiseState: noiseState as any,
                    rpk: Buffer.alloc(33),
                });

                sandbox.stub(sut, "_initiateHandshake").throws(new Error("boom"));
                const spy = sinon.spy(sut, "destroy");
                // tslint:disable-next-line: no-empty
                sut.on("error", () => {});

                (sut as any)._onConnected();

                expect(spy.called).to.be.true;
            });
        });
    });

    describe("_onData", () => {
        let sut;
        beforeEach(() => {
            sut = new NoiseSocket({ socket: socket as any, noiseState: noiseState as any });
            sandbox.stub(sut, "_processInitiator");
            sandbox.stub(sut, "_processInitiatorReply");
            sandbox.stub(sut, "_processResponderReply");
            sandbox.stub(sut, "_processPacketLength");
            sandbox.stub(sut, "_processPacketBody");
            sandbox.stub(sut, "destroy");
        });

        it("should throw when INITIATOR_INITIATING", () => {
            (sut as any)._handshakeState = NoiseSocket.HANDSHAKE_STATE.INITIATOR_INITIATING;
            (sut as any)._onData();
            expect(sut.destroy.called).to.be.true;
        });

        it("should process responder act1 when AWAITING_INITIATOR", () => {
            (sut as any)._handshakeState = NoiseSocket.HANDSHAKE_STATE.AWAITING_INITIATOR;
            (sut as any)._onData();
            expect((sut as any)._processInitiator.called).to.be.true;
        });

        it("should process responder act3 when AWAITING_INITIATOR_REPLY", () => {
            (sut as any)._handshakeState = NoiseSocket.HANDSHAKE_STATE.AWAITING_INITIATOR_REPLY;
            (sut as any)._onData();
            expect((sut as any)._processInitiatorReply.called).to.be.true;
        });

        it("should process initiator act2 when AWAITING_RESPONDER_REPLY", () => {
            (sut as any)._handshakeState = NoiseSocket.HANDSHAKE_STATE.AWAITING_RESPONDER_REPLY;
            (sut as any)._onData();
            expect((sut as any)._processResponderReply.called).to.be.true;
        });

        it("should process length when READY_FOR_LEN", () => {
            (sut as any)._handshakeState = NoiseSocket.HANDSHAKE_STATE.READY;
            (sut as any)._readState = NoiseSocket.READ_STATE.READY_FOR_LEN;
            (sut as any)._onData();
            expect((sut as any)._processPacketLength.called).to.be.true;
        });

        it("should process body when READY_FOR_BODY", () => {
            (sut as any)._handshakeState = NoiseSocket.HANDSHAKE_STATE.READY;
            (sut as any)._readState = NoiseSocket.READ_STATE.READY_FOR_BODY;
            (sut as any)._onData();
            expect((sut as any)._processPacketBody.called).to.be.true;
        });

        it("should return false when BLOCKED", () => {
            (sut as any)._handshakeState = NoiseSocket.HANDSHAKE_STATE.READY;
            (sut as any)._readState = NoiseSocket.READ_STATE.BLOCKED;
            (sut as any)._onData();
            expect((sut as any)._processPacketLength.called).to.be.false;
            expect((sut as any)._processPacketBody.called).to.be.false;
        });

        it("should throw when UNKOWN", () => {
            (sut as any)._handshakeState = NoiseSocket.HANDSHAKE_STATE.READY;
            (sut as any)._readState = -1;
            (sut as any)._onData();
            expect(sut.destroy.called).to.be.true;
        });
    });

    describe("_initiateHandshake", () => {
        it("should send act1 message", () => {
            noiseState.initiatorAct1.returns(Buffer.from("act1 message"));

            const sut = new NoiseSocket({ socket: socket as any, noiseState: noiseState as any });
            (sut as any)._initiateHandshake();

            expect(socket.write.args[0][0]).is.deep.equal(Buffer.from("act1 message"));
        });

        it("should transition state to AWAITING_RESPONDER_REPLY", () => {
            const sut = new NoiseSocket({ socket: socket as any, noiseState: noiseState as any });
            (sut as any)._initiateHandshake();
            expect((sut as any)._readState).to.equal(
                NoiseSocket.HANDSHAKE_STATE.AWAITING_RESPONDER_REPLY,
            );
        });
    });

    describe("_processInitiator", () => {
        describe("when not enough data", () => {
            it("should return false", () => {
                const sut = new NoiseSocket({
                    socket: socket as any,
                    noiseState: noiseState as any,
                });
                expect((sut as any)._processInitiator()).to.not.be.true;
            });
        });

        describe("when data", () => {
            beforeEach(() => {
                socket.read.returns(Buffer.alloc(50));
                noiseState.recieveAct2.returns(Buffer.from("act2 message"));
            });

            it("should send act2 reply", () => {
                const sut = new NoiseSocket({
                    socket: socket as any,
                    noiseState: noiseState as any,
                });
                (sut as any)._processInitiator();
                expect(socket.write.args[0][0]).to.deep.equal(Buffer.from("act2 message"));
            });

            it("should transition to AWAITING_INITIATOR_REPLY", () => {
                const sut = new NoiseSocket({
                    socket: socket as any,
                    noiseState: noiseState as any,
                });
                (sut as any)._processInitiator();
                expect((sut as any)._handshakeState).to.equal(
                    NoiseSocket.HANDSHAKE_STATE.AWAITING_INITIATOR_REPLY,
                );
            });
        });
    });

    describe("_processInitiatorReply", () => {
        describe("when not enough data", () => {
            it("should return false", () => {
                const sut = new NoiseSocket({
                    socket: socket as any,
                    noiseState: noiseState as any,
                });
                expect((sut as any)._processInitiatorReply()).to.not.be.true;
            });
        });

        describe("when data", () => {
            beforeEach(() => {
                socket.read.returns(Buffer.alloc(66));
            });

            it("should transition to READY", () => {
                const sut = new NoiseSocket({
                    socket: socket as any,
                    noiseState: noiseState as any,
                });
                (sut as any)._processInitiatorReply();
                expect((sut as any)._handshakeState).to.equal(NoiseSocket.HANDSHAKE_STATE.READY);
            });

            it("should emit connect event", done => {
                const sut = new NoiseSocket({
                    socket: socket as any,
                    noiseState: noiseState as any,
                });
                sut.on("connect", () => done());
                (sut as any)._processInitiatorReply();
            });

            it("should emit ready event", done => {
                const sut = new NoiseSocket({
                    socket: socket as any,
                    noiseState: noiseState as any,
                });
                sut.on("ready", () => done());
                (sut as any)._processInitiatorReply();
            });

            it("should attach rpk to the socket", () => {
                const rpk = Buffer.alloc(33);
                noiseState.rpk = rpk;
                const sut = new NoiseSocket({
                    socket: socket as any,
                    noiseState: noiseState as any,
                });
                expect(sut.rpk).to.be.undefined;
                (sut as any)._processInitiatorReply();
                expect(sut.rpk).to.equal(rpk);
            });

            it("should return true to indicate data was processed", () => {
                const sut = new NoiseSocket({
                    socket: socket as any,
                    noiseState: noiseState as any,
                });
                expect((sut as any)._processInitiatorReply()).to.be.true;
            });
        });
    });

    describe("_processResponderReply", () => {
        describe("when not enough data", () => {
            it("should return if not enough data", () => {
                const sut = new NoiseSocket({
                    socket: socket as any,
                    noiseState: noiseState as any,
                });
                expect((sut as any)._processResponderReply()).to.not.be.true;
            });
        });

        describe("when data", () => {
            beforeEach(() => {
                socket.read.returns(Buffer.alloc(50));
                noiseState.initiatorAct3.returns(Buffer.from("act3 message"));
            });

            it("should write act3 message", () => {
                const sut = new NoiseSocket({
                    socket: socket as any,
                    noiseState: noiseState as any,
                });
                (sut as any)._processResponderReply();
                expect(socket.write.args[0][0]).to.deep.equal(Buffer.from("act3 message"));
            });

            it("should transition to state READY", () => {
                const sut = new NoiseSocket({
                    socket: socket as any,
                    noiseState: noiseState as any,
                });
                (sut as any)._processResponderReply();
                expect((sut as any)._handshakeState).to.equal(NoiseSocket.HANDSHAKE_STATE.READY);
            });

            it("should emit connect event", done => {
                const sut = new NoiseSocket({
                    socket: socket as any,
                    noiseState: noiseState as any,
                });
                sut.on("connect", () => done());
                (sut as any)._processResponderReply();
            });

            it("should emit ready event", done => {
                const sut = new NoiseSocket({
                    socket: socket as any,
                    noiseState: noiseState as any,
                });
                sut.on("ready", () => done());
                (sut as any)._processResponderReply();
            });

            it("should return true to indicate data was processed", () => {
                const sut = new NoiseSocket({
                    socket: socket as any,
                    noiseState: noiseState as any,
                });
                expect((sut as any)._processResponderReply()).to.be.true;
            });
        });
    });

    describe("_processPacketLength", () => {
        describe("when not enough data", () => {
            it("should return false", () => {
                const sut = new NoiseSocket({
                    socket: socket as any,
                    noiseState: noiseState as any,
                });
                expect((sut as any)._processPacketLength()).to.not.be.true;
            });
        });

        describe("when data", () => {
            beforeEach(() => {
                socket.read.returns(Buffer.alloc(18));
                noiseState.decryptLength.returns(24);
            });

            it("should store the decrypted length", () => {
                const sut = new NoiseSocket({
                    socket: socket as any,
                    noiseState: noiseState as any,
                });
                (sut as any)._processPacketLength();
                expect((sut as any)._l).to.equal(24);
            });

            it("should transition to READY_FOR_BODY", () => {
                const sut = new NoiseSocket({
                    socket: socket as any,
                    noiseState: noiseState as any,
                });
                (sut as any)._processPacketLength();
                expect((sut as any)._readState).to.equal(NoiseSocket.READ_STATE.READY_FOR_BODY);
            });

            it("should return true indicating data was processed", () => {
                const sut = new NoiseSocket({
                    socket: socket as any,
                    noiseState: noiseState as any,
                });
                expect((sut as any)._processPacketLength()).to.be.true;
            });
        });
    });

    describe("_processPacketBody", () => {
        describe("when not enough data", () => {
            it("should return false", () => {
                const sut = new NoiseSocket({
                    socket: socket as any,
                    noiseState: noiseState as any,
                });
                expect((sut as any)._processPacketBody()).to.not.be.true;
            });
        });

        describe("when data", () => {
            beforeEach(() => {
                socket.read.returns(Buffer.alloc(80));
                noiseState.decryptMessage.returns("some message" as any);
            });

            it("should increase the messagesReceived counter", () => {
                const sut = new NoiseSocket({
                    socket: socket as any,
                    noiseState: noiseState as any,
                });
                sandbox.stub(sut, "push").returns(true);
                (sut as any)._processPacketBody();
                expect(sut.messagesReceived).to.equal(1);
            });

            it("should push the decrypted message onto the read buffer", () => {
                const sut = new NoiseSocket({
                    socket: socket as any,
                    noiseState: noiseState as any,
                });
                sandbox.stub(sut, "push").returns(true);
                (sut as any)._processPacketBody();
                expect((sut.push as any).args[0][0]).to.equal("some message");
            });

            it("should transition to READY_FOR_LEN", () => {
                const sut = new NoiseSocket({
                    socket: socket as any,
                    noiseState: noiseState as any,
                });
                sandbox.stub(sut, "push").returns(true);
                (sut as any)._processPacketBody();
                expect((sut as any)._readState).to.equal(2);
            });

            it("should return true", () => {
                const sut = new NoiseSocket({
                    socket: socket as any,
                    noiseState: noiseState as any,
                });
                sandbox.stub(sut, "push").returns(true);
                expect((sut as any)._processPacketBody()).to.be.true;
            });
        });

        describe("when data and read backpressure", () => {
            beforeEach(() => {
                socket.read.returns(Buffer.alloc(80));
                noiseState.decryptMessage.returns("some message" as any);
            });

            it("should transition to state BLOCKED", () => {
                const sut = new NoiseSocket({
                    socket: socket as any,
                    noiseState: noiseState as any,
                });
                sandbox.stub(sut, "push").returns(false);
                (sut as any)._processPacketBody();
                expect((sut as any)._readState).to.equal(4);
            });

            it("should return false", () => {
                const sut = new NoiseSocket({
                    socket: socket as any,
                    noiseState: noiseState as any,
                });
                sandbox.stub(sut, "push").returns(false);
                expect((sut as any)._processPacketBody()).to.be.false;
            });
        });
    });

    describe("_read", () => {
        it("should abort if handshake not ready", done => {
            const sut = new NoiseSocket({ socket: socket as any, noiseState: noiseState as any });
            (sut as any)._handshakeState = READ_STATE.BLOCKED;
            sandbox.stub(sut, "_onData");
            (sut as any)._read();
            setTimeout(() => {
                try {
                    expect((sut as any)._onData.called).to.be.false;
                    done();
                } catch (ex) {
                    done(ex);
                }
            }, 1);
        });

        it("should trigger read asynchrously to prevent cycle", done => {
            const sut = new NoiseSocket({ socket: socket as any, noiseState: noiseState as any });
            (sut as any)._handshakeState = NoiseSocket.HANDSHAKE_STATE.READY;
            sandbox.stub(sut, "_onData");
            (sut as any)._read();
            expect((sut as any)._onData.called).to.be.false;
            setTimeout(() => {
                try {
                    expect((sut as any)._onData.called).to.be.true;
                    done();
                } catch (ex) {
                    done(ex);
                }
            }, 1);
        });
        it("should transition from BLOCKED TO READY_FOR_LEN", () => {
            const sut = new NoiseSocket({ socket: socket as any, noiseState: noiseState as any });
            (sut as any)._handshakeState = NoiseSocket.HANDSHAKE_STATE.READY;
            (sut as any)._readState = NoiseSocket.READ_STATE.BLOCKED;
            (sut as any)._read();
            expect((sut as any)._readState).to.equal(NoiseSocket.READ_STATE.READY_FOR_LEN);
        });
    });

    describe("_write", () => {
        it("shouuld write the encrypted message", () => {
            const sut = new NoiseSocket({ socket: socket as any, noiseState: noiseState as any });
            noiseState.encryptMessage.returns(Buffer.from("encrypted message"));
            (sut as any)._write(Buffer.from("some data"), null, sinon.stub());
            expect(socket.write.args[0][0]).to.deep.equal(Buffer.from("encrypted message"));
        });
    });
});
