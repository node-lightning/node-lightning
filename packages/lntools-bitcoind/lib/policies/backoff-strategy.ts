export interface IBackoffStrategy {
  backoff(): Promise<void>;
}
