import { ILogger } from "@node-lightning/logger";
import assert from "assert";
import { Socket } from "net";
import { Duplex } from "stream";
import { HANDSHAKE_STATE } from "./handshake-state";
import { NoiseError } from "./noise-error";
import { NoiseSocketOptions } from "./noise-socket-options";
import { NoiseState } from "./noise-state";
import { READ_STATE } from "./read-state";

export class NoiseSocket extends Duplex {
    public static READ_STATE = READ_STATE;
    public static HANDSHAKE_STATE = HANDSHAKE_STATE;

    /**
     * Remote public key as a 33-byte compressed public key for
     * elliptic curve secp256k1
     */
    public rpk: Buffer;

    /**
     * Indicates if the socket was the connection initiator
     * which will determine how the handshake happens.
     */
    public initiator: boolean;

    /**
     * Count of messages received by the socket.
     */
    public messagesReceived: number;

    /**
     * A logger instance
     */
    public logger: ILogger;

    /**
     * Controls the handshake process at the start of the connection.
     * The socket is not readable until the handshake has been performed.
     */
    private _handshakeState: HANDSHAKE_STATE;

    /**
     * Controls how reading and piping from the underlying TCP socket to
     * the Duplex Streams read buffer works
     */
    private _readState: READ_STATE;

    /**
     * Private property that maintains the handshakes and
     * encrypts and decrypts messages while maintaining the
     * proper key rotation scheme used defined in BOLT #8.
     */
    private _noiseState: NoiseState;

    /**
     * The wrapped socket
     */
    private _socket: Socket;

    /**
     * Message length state used for messages that may be split
     * across multiple packets.
     */
    private _l: number;

    /**
     * NoiseSocket is a Duplex Stream that wraps a standard TCP Socket
     * and layers in the BOLT #8 implementation of the Noise Protocol
     * Framework.
     *
     * This socket can be used for any communication that wants to
     * benefit from the security and privacy enhancing used by the
     * Noise Protocol Framework.
     */
    constructor({ socket, noiseState, rpk, logger, highWaterMark = 2048 }: NoiseSocketOptions) {
        super({ objectMode: true, highWaterMark });
        // perform type assertions
        assert.ok(socket instanceof Socket, new NoiseError("socket argument must be an instance of Socket")); // prettier-ignore

        this.rpk = rpk;

        // if remote is provided, then we are the initiator
        this.initiator = rpk !== undefined;

        this._handshakeState = this.initiator
            ? HANDSHAKE_STATE.INITIATOR_INITIATING
            : HANDSHAKE_STATE.AWAITING_INITIATOR;

        this._readState = READ_STATE.READY_FOR_LEN;

        this._noiseState = noiseState;

        this.messagesReceived = 0;

        this._socket = socket;

        this._socket.on("close", hadError => this.emit("close", hadError));
        this._socket.on("connect", this._onConnected.bind(this));
        this._socket.on("drain", () => this.emit("drain"));
        this._socket.on("end", () => this.emit("end"));
        this._socket.on("error", err => this.emit("error", err));
        this._socket.on("lookup", (e, a, f, h) => this.emit("lookup", e, a, f, h));
        this._socket.on("readable", this._onData.bind(this));
        this._socket.on("timeout", () => this.emit("timeout"));

        this.logger = logger;
    }

    /**
     * Half-closes the socket. It is still possible that the opposite
     * side is still sending data.
     */
    public end(): NoiseSocket {
        this._socket.end();
        return this;
    }

    /**
     * Destroys the socket and ensures that no more I/O activity happens
     * on the socket. When an `err` is included, an 'error' event will
     * be emitted and all listeners will receive the error as an
     * argument.
     * @param err optional error to send
     */
    public destroy(err?: Error): NoiseSocket {
        this._socket.destroy(err);
        return this;
    }

    /**
     * Fires when the socket has connected. This method initiates the
     * handshake and if there is a failure, terminates the connection.
     */
    private _onConnected() {
        try {
            if (this.initiator) {
                this._initiateHandshake();
            }
        } catch (err) {
            this.destroy(err);
        }
    }

    /**
     * _onData is triggered by the "readable" event on the
     * underlying TCP socket. It is called each time there is new data
     * received. It is responsible for reading data from the socket and
     * performing the appropriate action given the current read state.
     */
    private _onData() {
        try {
            // Loop while there was still data to process on the socket's
            // buffer. This will stop when we don't have enough data or
            // we encounter a back pressure issue;
            let readMore = true;
            do {
                if (this._handshakeState !== HANDSHAKE_STATE.READY) {
                    switch (this._handshakeState) {
                        // Initiator received data before initialized
                        case HANDSHAKE_STATE.INITIATOR_INITIATING:
                            throw new NoiseError("Pending state is invalid");

                        // Responder Act1
                        case HANDSHAKE_STATE.AWAITING_INITIATOR:
                            readMore = this._processInitiator();
                            break;

                        // Responder Act3
                        case HANDSHAKE_STATE.AWAITING_INITIATOR_REPLY:
                            readMore = this._processInitiatorReply();
                            break;

                        // Initiator Act2
                        case HANDSHAKE_STATE.AWAITING_RESPONDER_REPLY:
                            readMore = this._processResponderReply();
                            break;
                    }
                } else {
                    switch (this._readState) {
                        case READ_STATE.READY_FOR_LEN:
                            readMore = this._processPacketLength();
                            break;
                        case READ_STATE.READY_FOR_BODY:
                            readMore = this._processPacketBody();
                            break;
                        case READ_STATE.BLOCKED:
                            readMore = false;
                            break;
                        default:
                            throw new NoiseError("Unknown read state");
                    }
                }
            } while (readMore);
        } catch (err) {
            // Terminate on failures as we won't be able to recovery
            // since the noise state has rotated nonce and we won't
            // be able to any more data without additional errors.
            this.destroy(err);
        }
    }

    private _initiateHandshake() {
        // create Initiator Act 1 message
        const m = this._noiseState.initiatorAct1(this.rpk);

        // send message to Responder
        this._socket.write(m);

        // transition state
        this._handshakeState = HANDSHAKE_STATE.AWAITING_RESPONDER_REPLY;
    }

    private _processInitiator() {
        // must read 50 bytes
        let m = this._socket.read(50) as Buffer;
        if (!m) return false;

        // validate initiator act1 message
        this._noiseState.receiveAct1(m);

        // create reply message
        m = this._noiseState.recieveAct2();

        // send the reply
        this._socket.write(m);

        // transition
        this._handshakeState = HANDSHAKE_STATE.AWAITING_INITIATOR_REPLY;

        // indicate processing was successful
        return true;
    }

    private _processInitiatorReply() {
        // must read 66 bytes
        const m = this._socket.read(66) as Buffer;
        if (!m) return false;

        // validate initiator act3 message
        this._noiseState.receiveAct3(m);

        // transition
        this._handshakeState = HANDSHAKE_STATE.READY;

        // capture the rpk since it is now available
        this.rpk = this._noiseState.rpk;

        // emit that we're ready!
        this.emit("connect");
        this.emit("ready");

        // return true to continue processing
        return true;
    }

    private _processResponderReply() {
        // must read 50 bytes
        let m = this._socket.read(50) as Buffer;
        if (!m) return;

        // process reply
        this._noiseState.initiatorAct2(m);

        // create final act of the handshake
        m = this._noiseState.initiatorAct3();

        // send final handshake
        this._socket.write(m);

        // transition
        this._handshakeState = HANDSHAKE_STATE.READY;

        // emit that we're ready!
        this.emit("connect");
        this.emit("ready");

        // return true to continue processing
        return true;
    }

    private _processPacketLength() {
        const LEN_CIPHER_BYTES = 2;
        const LEN_MAC_BYTES = 16;

        // Try to read the length cipher bytes and the length MAC bytes
        // If we cannot read the 18 bytes, the attempt to process the
        // message will abort.
        const lc = this._socket.read(LEN_CIPHER_BYTES + LEN_MAC_BYTES) as Buffer;
        if (!lc) return;

        // Decrypt the length including the MAC
        const l = this._noiseState.decryptLength(lc);

        // We need to store the value in a local variable in case
        // we are unable to read the message body in its entirety.
        // This allows us to skip the length read and prevents
        // nonce issues since we've already decrypted the length.
        this._l = l;

        // Transition state
        this._readState = READ_STATE.READY_FOR_BODY;

        // return true to continue reading
        return true;
    }

    private _processPacketBody() {
        const MESSAGE_MAC_BYTES = 16;

        // With the length, we can attempt to read the message plus
        // the MAC for the message. If we are unable to read because
        // there is not enough data in the read buffer, we need to
        // store l. We are not able to simply unshift it becuase we
        // have already rotated the keys.
        const c = this._socket.read(this._l + MESSAGE_MAC_BYTES) as Buffer;
        if (!c) return;

        // Decrypt the full message cipher + MAC
        const m = this._noiseState.decryptMessage(c);

        // Now that we've read the message, we can remove the
        // cached length before we transition states
        this._l = null;

        // Increment the number of messages received
        this.messagesReceived++;

        // Push the message onto the read buffer for the consumer to
        // read. We are mindful of slow reads by the consumer and
        // will respect backpressure signals.
        const pushOk = this.push(m);
        if (pushOk) {
            this._readState = READ_STATE.READY_FOR_LEN;
            return true;
        } else {
            if (this.logger) this.logger.debug("socket read is blocked");
            this._readState = READ_STATE.BLOCKED;
            return false;
        }
    }

    // tslint:disable-next-line: member-ordering
    public _read() {
        if (this._handshakeState !== HANDSHAKE_STATE.READY) {
            return;
        }

        if (this._readState === READ_STATE.BLOCKED) {
            if (this.logger) this.logger.debug("socket read is unblocked");
            this._readState = READ_STATE.READY_FOR_LEN;
        }
        // Trigger a read but wait until the end of the event loop.
        // This is necessary when reading in paused mode where
        // _read was triggered by stream.read() originating inside
        // a "readable" event handler. Attempting to push more data
        // synchronously will not trigger another "readable" event.
        setImmediate(() => this._onData());
    }

    // tslint:disable-next-line: member-ordering
    public _write(data: Buffer, encoding: string, cb: (err: Error) => void) {
        const c = this._noiseState.encryptMessage(data);
        this._socket.write(c, cb);
    }

    public _final() {
        //
    }
}
