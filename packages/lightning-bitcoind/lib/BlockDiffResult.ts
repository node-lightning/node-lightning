import { BlockHeader } from "@node-lightning/bitcoind";

export class BlockDiffResult {
    constructor(
        readonly commonAncestor: BlockHeader,
        readonly disconnects: BlockHeader[],
        readonly connects: BlockHeader[],
    ) {}
}
