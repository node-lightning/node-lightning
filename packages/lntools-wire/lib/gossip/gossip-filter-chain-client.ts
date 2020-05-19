/**
 * The interface required by the GossipFilter to perform on-chain validation checks
 * of messages. A simplified interface is required by the GossipFilter. The actual
 * chain client implementation may offer a broader set of feautures. Additionally,
 * an adapter could be constructred to make an chain client conform to that required
 * by the GossipFilter.
 */
export interface IGossipFilterChainClient {
  getBlockHash(height: number): Promise<string>;
  getBlock(hash: string): Promise<HasTxStrings>;
  getUtxo(txId: string, voutIdx: number): Promise<HasScriptPubKey & HasValue>;
  waitForSync(): Promise<boolean>;
}

export type HasTxStrings = {
  tx: string[];
};

export type HasScriptPubKey = {
  scriptPubKey: HasHex;
};

export type HasValue = {
  value: number;
};

export type HasHex = {
  hex: string;
};
