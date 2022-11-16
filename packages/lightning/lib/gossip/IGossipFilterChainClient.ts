/**
 * The interface required by the GossipFilter to perform on-chain validation checks
 * of messages. A simplified interface is required by the GossipFilter. The actual
 * chain client implementation may offer a broader set of features. Additionally,
 * an adapter could be constructed to make an chain client conform to that required
 * by the GossipFilter.
 */
export interface IGossipFilterChainClient {
    getBlockHash(height: number): Promise<string>;
    getBlockSummary(hash: string): Promise<BlockSummary>;
    getUtxo(txId: string, voutIdx: number): Promise<Utxo>;
    waitForSync(): Promise<boolean>;
}

export interface BlockSummary {
    tx: string[];
    [others: string]: any;
}

export interface HasScriptPubKey {
    scriptPubKey: HasHex;
    [others: string]: any;
}

export interface HasValue {
    value: number;
    [others: string]: any;
}

export interface HasHex {
    hex: string;
    [others: string]: any;
}

export interface Utxo extends HasScriptPubKey, HasValue {
    [others: string]: any;
}
