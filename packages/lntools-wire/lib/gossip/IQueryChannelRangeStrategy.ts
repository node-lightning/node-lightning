export interface IQueryChannelRangeStrategy {
    queryRange(firstBlocknum: number, numberOfBlocks: number): void;
}
