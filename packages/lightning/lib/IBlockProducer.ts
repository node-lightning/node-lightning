import { Block } from "@node-lightning/bitcoin";

export type BlockProducerFn = (block: Block) => Promise<void>;

export interface IBlockProducer {
    onBlockConnected: BlockProducerFn;
    onBlockDisconnected: BlockProducerFn;
}
