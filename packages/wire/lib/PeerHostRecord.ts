export class PeerHostRecord {
    constructor(readonly publicKey: Buffer, readonly address: string, readonly port: number) {
        this.publicKey = publicKey;
        this.address = address;
        this.port = port;
    }
}
