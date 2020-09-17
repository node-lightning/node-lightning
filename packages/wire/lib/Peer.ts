import { ILogger } from "@node-lightning/logger";
import * as noise from "@node-lightning/noise";
import { NoiseSocket } from "@node-lightning/noise";
import assert from "assert";
import { EventEmitter } from "events";
import { BitField } from "./BitField";
import { InitFeatureFlags } from "./flags/InitFeatureFlags";
import * as MessageFactory from "./MessageFactory";
import { InitMessage } from "./messages/InitMessage";
import { IWireMessage } from "./messages/IWireMessage";
import { PeerState } from "./PeerState";
import { PingPongState } from "./PingPongState";

export interface IMessageSender {
    send(buf: Buffer): void;
    sendMessage(msg: IWireMessage): void;
}

export interface IMessageReceiver {
    on(event: "message", listener: (msg: IWireMessage) => void): this;
    off(event: "message", listener: (msg: IWireMessage) => void): this;
}

export type IMessageSenderReceiver = IMessageSender & IMessageReceiver;

export interface IPeer extends IMessageSenderReceiver {
    send(buf: Buffer): void;
    sendMessage(msg: IWireMessage): void;
    disconnect(): void;

    on(event: "message", listener: (msg: IWireMessage) => void): this;
    on(event: "error", listener: (err: Error) => void): this;
}

/**
 * Peer is an EventEmitter that layers the Lightning Network wire
 * protocol ontop of an @node-lightning/noise NoiseSocket.
 *
 * Peer itself is a state-machine with three states:
 * 1. pending
 * 2. awaiting_peer_init
 * 3. ready
 *
 * The Peer instance starts in `pending` until the underlying NoiseSocket
 * has connected.
 *
 * It then immediately sends the InitMessage as specified in the Peer
 * constructor.
 *
 * At this point, the Peer transitions to `awaiting_peer_init`.
 *
 * Once the remote peer has sent its InitMessage, the state is
 * transitioned to `ready` and the Peer can be begin sending and
 * receiving messages.
 *
 * Once the peer is in the `ready` state it will begin emitting `message`
 * events when it receives new messages from the peer.
 *
 * The Peer will also start a PingPong state machine to manage sending
 * and receiving Pings and Pongs as defined in BOLT01
 *
 * A choice (probably wrongly) was made to make Peer an EventEmitter
 * instead of a DuplexStream operating in object mode. We need to keep
 * the noise socket in flowing mode (instead of paused) because we will
 * not know the length of messages until after we have deserialized the
 * message. This makes it a challenge to implement a DuplexStream that
 * emits objects (such as messages).
 *
 * @emits ready the underlying socket has performed its handshake and
 * initialization message swap has occurred.
 *
 * @emits message a new message has been received. Only sent after the
 * `ready` event has fired.
 *
 * @emits rawmessage outputs the message as a raw buffer instead of
 * a deserialized message.
 *
 * @emits error emitted when there is an error processing a message.
 * The underlying socket will be closed after this event is emitted.
 *
 * @emits close emitted when the connection to the peer has completedly
 * closed.
 *
 * @emits open emmited when the connection to the peer has been established
 * after the handshake has been performed
 *
 * @emits end emitted when the connection to the peer is ending.
 */
export class Peer extends EventEmitter implements IPeer {
    public static states = PeerState;

    public state: PeerState = PeerState.Disconnected;
    public socket: NoiseSocket;
    public messageCounter: number = 0;
    public pingPongState: PingPongState;
    public logger: ILogger;
    public remoteFeatures: BitField<InitFeatureFlags>;
    public remoteChains: Buffer[];
    public isInitiator: boolean = false;
    public reconnectTimeoutMs = 15000;

    private _id: string;
    private _rpk: Buffer;

    private _host: string;
    private _port: number;

    private _reconnectHandle: NodeJS.Timeout;

    constructor(
        readonly ls: Buffer,
        readonly localFeatures: BitField<InitFeatureFlags>,
        readonly localChains: Buffer[],
        logger: ILogger,
    ) {
        super();

        this.pingPongState = new PingPongState(this);
        this.logger = logger;
    }

    public get id(): string {
        return this._id;
    }

    public get pubkey(): Buffer {
        return this._rpk;
    }

    public get pubkeyHex(): string {
        return this._rpk ? this._rpk.toString("hex") : undefined;
    }

    /**
     * Connect to the remote peer and binds socket events into the Peer.
     */
    public connect(rpk: Buffer, host: string, port: number) {
        // construct logger specific to the peer
        this._rpk = rpk;
        this._id = this._rpk.slice(0, 8).toString("hex");
        this.logger = this.logger.sub("peer", this._id);

        this.logger.info("connecting to peer");
        this.isInitiator = true;

        // store these values if we need to use them for a reconnection event.
        this._host = host;
        this._port = port;

        // create the socket and initiate the connection
        this.socket = noise.connect({
            ls: this.ls,
            host: this._host,
            port: this._port,
            rpk: this._rpk,
            logger: this.logger,
        });
        this.socket.on("ready", this._onSocketReady.bind(this));
        this.socket.on("close", this._onSocketClose.bind(this));
        this.socket.on("error", this._onSocketError.bind(this));
        this.socket.on("data", this._onSocketData.bind(this));
    }

    /**
     *
     * @param socket
     */
    public attach(socket: NoiseSocket) {
        this.isInitiator = false;
        this.socket = socket;
        this.socket.on("ready", this._onSocketReady.bind(this));
        this.socket.on("close", this._onSocketClose.bind(this));
        this.socket.on("error", this._onSocketError.bind(this));
        this.socket.on("data", this._onSocketData.bind(this));

        // Once the socket is ready, we have performed the handshake which allows
        // us to ascertain the identity of the connecting node. Now that we have
        // that identity ascertained we can construct the instance specific logger
        this.socket.once("ready", () => {
            this._rpk = socket.rpk;
            this._id = this._rpk.slice(0, 8).toString("hex");
            this.logger = this.logger.sub("peer", this._id);
            this.logger.info("peer connected");
        });
    }

    /**
     * Writes data on the NoiseSocket. This method allows custom
     * serialization of methods. Use `sendMessage` to send a message
     * using the default message serialization.
     * @param buf
     */
    public send(buf: Buffer): boolean {
        assert.ok(this.state === PeerState.Ready, new Error("Peer is not ready"));
        this.emit("sending", buf);
        return this.socket.write(buf);
    }

    /**
     * Writes the message on the NoiseSocket using the default
     * serialization properties
     */
    public sendMessage(m: any): boolean {
        assert.ok(this.state === PeerState.Ready, new Error("Peer is not ready"));
        const buf = m.serialize() as Buffer;
        this.emit("sending", buf);
        return this.socket.write(buf);
    }

    /**
     * Closes the socket
     */
    public disconnect() {
        this.logger.info("disconnecting");
        this.state = PeerState.Disconnecting;
        this.socket.end();
    }

    /**
     * Reconnects the socket
     */
    public reconnect() {
        this.socket.end();
    }

    /////////////////////////////////////////////////////////

    private _onSocketReady() {
        // now that we're connected, we need to wait for the remote reply
        // before any other messages can be receieved or sent
        this.state = PeerState.AwaitingPeerInit;

        // blast off our init message
        this.emit("open");
        this._sendInitMessage();
    }

    private _onSocketClose() {
        this.logger.debug("socket closed");

        // Clear any existing reconnection handles. We want the logic in
        // this method, and the current state of the peer to dictate
        // what should happen.
        clearTimeout(this._reconnectHandle);

        // Clear the ping/pong status
        if (this.pingPongState) this.pingPongState.onDisconnecting();

        // If socket closed because there was a request to disconnect
        // the underlying socket, we will emit a close event and mark
        // the state as disconnected.
        if (this.state === PeerState.Disconnecting) {
            this.logger.debug("permanently disconnected");
            this.emit("close");
            this.state = PeerState.Disconnected;
            return;
        }

        // If the disconnection was not intentional, we will initiate
        // a reconnection event by creating a reconnection handle
        // and delaying the connection event by the reconnectTimeoutMs
        // value.
        // This is likely to originate from two sources:
        // 1) A reconnection was requeted by the ping/pong manager because
        //    receipt of a pong message timed out
        // 2) A network error occurred on a subsequent connection event
        //    which triggered a socket close event. This can happen if a connection
        //    is disrupted for a longer period of time. The reconnection logic
        //    should continue to fire until a connection can be established.
        if (this.isInitiator) {
            this.logger.debug(`reconnecting in ${(this.reconnectTimeoutMs / 1000).toFixed(1)}s`);
            this._reconnectHandle = setTimeout(() => {
                this.connect(this._rpk, this._host, this._port);
            }, this.reconnectTimeoutMs);
        }
    }

    private _onSocketError(err) {
        // emit what error we recieved
        this.emit("error", err);
    }

    private _onSocketData(raw) {
        try {
            if (this.state === PeerState.AwaitingPeerInit) {
                this._processPeerInitMessage(raw);
            } else {
                this._processMessage(raw);
            }
        } catch (err) {
            // we have a problem, kill connectinon with the client
            this.socket.end();

            // emit the error event
            this.emit("error", err);
        }
    }

    /**
     * Sends the initialization message to the peer. This message
     * does not matter if it is sent before or after the peer sends
     * there message.
     */
    private _sendInitMessage() {
        // construct the init message
        const msg = new InitMessage();
        msg.features = this.localFeatures;
        msg.chainHashes = this.localChains;

        // fire off the init message to the peer
        const payload = msg.serialize();
        this.emit("sending", payload);
        this.socket.write(payload);
    }

    /**
     * Processes the initialization message sent by the remote peer.
     * Once this is successfully completed, the state is transitioned
     * to `active`
     */
    private _processPeerInitMessage(raw: Buffer) {
        // deserialize message
        const m = MessageFactory.deserialize(raw) as InitMessage;
        if (this.logger) {
            const features: InitFeatureFlags[] = m.features.flags();
            this.logger.info("peer initialized with features", features);
        }

        // ensure we got an InitMessagee
        assert.ok(m instanceof InitMessage, new Error("Expecting InitMessage"));

        // store the init messagee in case we need to refer to it
        this.remoteFeatures = m.features;

        // capture the local chains
        this.remoteChains = m.chainHashes;

        // validate remote chains and if we are unawares of any. We do this by
        // first looking to see if there is any match on the chains. If there is
        // no match and both the remote and our local node declare that we are
        // monitoring a specific chain then we will abort the connnection
        let hasChain = false;
        for (const remoteChain of this.remoteChains) {
            for (const localChain of this.localChains) {
                if (remoteChain.equals(localChain)) hasChain = true;
            }
        }
        if (!hasChain && this.remoteChains.length && this.localChains.length) {
            this.logger.trace("remote chains", ...this.remoteChains);
            this.logger.trace("local chains", ...this.localChains);
            this.logger.warn("remote node does not support any known chains, aborting");
            this.disconnect();
            return;
        }

        // we need to be sure that the remote node supports required features
        // that we care about. If the remote node does not support these feature
        // we will disconnect.
        for (const feature of this.localFeatures.flags()) {
            // we can skip odd features since they are optional
            if (feature % 2 === 1) continue;

            // for even (compulsory) features, we check if the remote node is
            // signalling either optional or compulsory support. This code
            // makes the assumption that the even features are always first
            if (!(this.remoteFeatures.isSet(feature) || this.remoteFeatures.isSet(feature + 1))) {
                this.disconnect();
                return;
            }
        }

        // start other state now that peer is initialized
        this.pingPongState.start();

        // transition state to ready
        this.state = PeerState.Ready;

        // emit ready event
        this.emit("ready");
    }

    /**
     * Process the raw message sent by the peer. These messages are
     * processed after the initialization message has been received.
     */
    private _processMessage(raw: Buffer) {
        // increment counter first so we know exactly how many messages
        // have been received by the peer regardless of whether they
        // could be processed
        this.messageCounter += 1;

        // emit the rawmessage event first so that if there is a
        // deserialization problem there is a chance that we were
        // able to capture the raw message for further testing
        this.emit("rawmessage", raw);

        // deserialize the message
        const m = MessageFactory.deserialize(raw);

        // ensure pingpong state is updated
        if (m) {
            this.pingPongState.onMessage(m);

            // emit the message
            this.emit("message", m);
        }
    }
}

// tslint:disable-next-line: interface-name
export declare interface Peer {
    addListener(event: "close", listener: () => void): this;
    addListener(event: "error", listener: (err: Error) => void): this;
    addListener(event: "message", listener: (msg: any) => void): this;
    addListener(event: "open", listener: () => void): this;
    addListener(event: "rawmessage", listener: (msg: Buffer) => void): this;
    addListener(event: "ready", listener: () => void): this;
    addListener(event: "sending", listener: (buf: Buffer) => void): this;

    listenerCount(
        event: "close" | "error" | "message" | "open" | "rawmessage" | "ready" | "sending",
    ): number;

    off(event: "close", listener: () => void): this;
    off(event: "error", listener: (err: Error) => void): this;
    off(event: "message", listener: (msg: IWireMessage) => void): this;
    off(event: "open", listener: () => void): this;
    off(event: "rawmessage", listener: (msg: Buffer) => void): this;
    off(event: "ready", listener: () => void): this;
    off(event: "sending", listener: (buf: Buffer) => void): this;

    on(event: "close", listener: () => void): this;
    on(event: "error", listener: (err: Error) => void): this;
    on(event: "message", listener: (msg: IWireMessage) => void): this;
    on(event: "open", listener: () => void): this;
    on(event: "rawmessage", listener: (msg: Buffer) => void): this;
    on(event: "ready", listener: () => void): this;
    on(event: "sending", listener: (buf: Buffer) => void): this;

    once(event: "close", listener: () => void): this;
    once(event: "error", listener: (err: Error) => void): this;
    once(event: "message", listener: (msg: IWireMessage) => void): this;
    once(event: "open", listener: () => void): this;
    once(event: "rawmessage", listener: (msg: Buffer) => void): this;
    once(event: "ready", listener: () => void): this;
    once(event: "sending", listener: (buf: Buffer) => void): this;

    prependListener(event: "close", listener: () => void): this;
    prependListener(event: "error", listener: (err: Error) => void): this;
    prependListener(event: "message", listener: (msg: IWireMessage) => void): this;
    prependListener(event: "open", listener: () => void): this;
    prependListener(event: "rawmessage", listener: (msg: Buffer) => void): this;
    prependListener(event: "ready", listener: () => void): this;
    prependListener(event: "sending", listener: (buf: Buffer) => void): this;

    prependOnceListener(event: "close", listener: () => void): this;
    prependOnceListener(event: "error", listener: (err: Error) => void): this;
    prependOnceListener(event: "message", listener: (msg: IWireMessage) => void): this;
    prependOnceListener(event: "open", listener: () => void): this;
    prependOnceListener(event: "rawmessage", listener: (msg: Buffer) => void): this;
    prependOnceListener(event: "ready", listener: () => void): this;
    prependOnceListener(event: "sending", listener: (buf: Buffer) => void): this;

    removeAllListeners(
        event?: "close" | "error" | "message" | "open" | "rawmessage" | "ready" | "sending",
    ): this;

    removeListener(event: "close", listener: () => void): this;
    removeListener(event: "error", listener: (err: Error) => void): this;
    removeListener(event: "message", listener: (msg: IWireMessage) => void): this;
    removeListener(event: "open", listener: () => void): this;
    removeListener(event: "rawmessage", listener: (msg: Buffer) => void): this;
    removeListener(event: "ready", listener: () => void): this;
    removeListener(event: "sending", listener: (buf: Buffer) => void): this;

    rawListeners(event: "close"): Array<() => void>;
    rawListeners(event: "error"): Array<(err: Error) => void>;
    rawListeners(event: "message"): Array<(msg: IWireMessage) => void>;
    rawListeners(event: "open"): Array<() => void>;
    rawListeners(event: "rawmessage"): Array<(msg: Buffer) => void>;
    rawListeners(event: "ready"): Array<() => void>;
    rawListeners(event: "sending"): Array<(buf: Buffer) => void>;
}
