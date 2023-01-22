import { BitcoindClient, BlockHeader } from "@node-lightning/bitcoind";
import { BlockDiffResult } from "./BlockDiffResult";

export class BlockDiffer {
    constructor(readonly bitcoind: BitcoindClient) {}

    /**
     * This method is used to construct the required block disconnects
     * and connects need to resync to the tip of the best blockchain even
     * if the prior header is now stale.
     *
     * For example, if the previous header was 4b and our current best
     * block header is 5c, we have a common ancestor of 2a and require
     * disconnecting 4b and 3b and connecting 3c, 4c, and 5c.
     *
     *      5c
     *      |
     *      4c  4b
     *      |   |
     *      3c  3b
     *      \   /
     *        2a
     *        |
     *        1a
     *        |
     *        0a
     *
     * If no fork is detected, we should expect to simply connect blocks
     * in the new best block chain.
     *
     * @param currentHeader best block header
     * @param priorHeader prior known header
     * @returns Actions needed to resolve a block difference
     */
    public async diff(
        currentHeader: BlockHeader,
        priorHeader: BlockHeader,
    ): Promise<BlockDiffResult> {
        const disconnects: BlockHeader[] = [];
        const connects: BlockHeader[] = [];

        // eslint-disable-next-line no-constant-condition
        while (true) {
            // When the current and prior chains have the same hash, we
            // have reached a common ancestor (or the last known block)
            // and can stop processing
            if (currentHeader.hash === priorHeader.hash) break;

            // Orphan chain is longer so we need to disconnect a block.
            // We process this first since an orphaned chain will always
            // have a lower chain height, thus ensuring the next
            // iteration always finds a matching ancestor.
            if (priorHeader.height >= currentHeader.height) {
                disconnects.push(priorHeader);
                priorHeader = await this.bitcoind.getHeader(priorHeader.previousblockhash);
            }

            // Current chain is longer so we need to connect a block and
            // work our way back until we have a common ancestor (or
            // find the last known block).
            if (currentHeader.height >= priorHeader.height) {
                connects.push(currentHeader);
                currentHeader = await this.bitcoind.getHeader(currentHeader.previousblockhash);
            }
        }

        return new BlockDiffResult(currentHeader, disconnects, connects.reverse());
    }
}
