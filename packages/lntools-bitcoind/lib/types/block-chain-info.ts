export type BlockChainInfo = {
  chain: string;
  blocks: number;
  headers: number;
  bestblockhash: string;
  difficulty: number;
  mediantime: number;
  verificationprogress: number;
  intialblockdownload: boolean;
  chainwork: string;
  size_on_disk: number;
  pruned: boolean;
};
