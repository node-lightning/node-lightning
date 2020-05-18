export interface IPolicy<T> {
  execute(fn: () => Promise<T>): void;
}
