export interface IGossipTimestampFilterStrategy {
  deactivate(): void;
  activate(start: number, range: number): void;
}
