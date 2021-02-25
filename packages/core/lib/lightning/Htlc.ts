import { Value } from "@node-lightning/bitcoin";
import { HtlcDirection } from "./HtlcDirection";

/**
 * An HTLC (hashed time-locked contract) is part of the transfer
 * layer of the Lightning network. HTLCs are used to trustlessly offer
 * a payment to a counterparty if they are able to provide a preimage
 * of the hash. The offeror can claw back funds after an expiration
 * period (absolute lock time) if the recipient is unable to provide
 * the preimage for the contract. HTLCs are used in Lightning for both
 * initiating payments to a peer directly and as part of forwarding
 * payments.
 */
export class Htlc {
    /**
     * The preimage of the payment hash using SHA256.
     */
    public paymentPreimage: Buffer;

    /**
     * Constructs an HTLC with associated information
     * @param htlcId Identifier for the HTLC is a counter maintained
     * per-channel, per-peer. It starts at zero and is incremented when
     * an HTLC is offered. This value is used when sending channel
     * related messages to disambiguate HTLCs that may share the same
     * preimage.
     *
     * @param direction Direction, from your node's perspective, that
     * indicates if the HTLC was offered or received.
     *
     * @param value The value of the HTLC in millisatoshi.
     *
     * @param cltvExpiry The absolutely blocktime expiry of the HTLC.
     * The value must be under 500,000,000 to ensure it is a block-based
     * locktime. After this timeout has expired, the offeror can perform
     * a forced resolution on-chain.
     *
     * @param paymentHash The 32-byte hash of the preimage. Knowledge of
     * the preimage is irrevocable and considers payment complete.
     */
    constructor(
        readonly htlcId: bigint,
        readonly direction: HtlcDirection,
        readonly value: Value,
        readonly cltvExpiry: number,
        readonly paymentHash: Buffer,
    ) {}
}
