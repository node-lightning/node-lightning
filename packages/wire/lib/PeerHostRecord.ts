/**
 * Represents a LN host that is a valid peer. This record may be
 * obtained from a DNS query that follows BOLT #10.
 */
export class PeerHostRecord {
    constructor(readonly publicKey: Buffer, readonly address: string, readonly port: number) {}
}
