export interface IPolicy<T> {
  execute(fn: () => Promise<T>): Promise<T>;
}
