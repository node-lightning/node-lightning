/**
 * Direction, from our node's perspective, of an HTLC.
 */
export enum HtlcDirection {
    /**
     * We have offered this HTLC to pay a node directly or on behalf
     * of a forward request.
     */
    Offered = 0,

    /**
     * We have accepted this HTLC from the counterparty. We may be the
     * final hop in a chain (and would posssess) the preimage or we may
     * be a processing hop in a sequence of payments.
     */
    Accepted = 1,
}
