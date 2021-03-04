import { IBackoffStrategy } from "./backoff-strategy";
import { IPolicy } from "./policy";

export class RetryPolicy<T> implements IPolicy<T> {
    private numFailures: number;
    private lastFailure: Error;

    constructor(readonly maxFailures: number, readonly backoffStrategy: IBackoffStrategy) {
        this.numFailures = 0;
    }

    public async execute(fn: () => Promise<T>): Promise<T> {
        while (this.numFailures < this.maxFailures) {
            try {
                return await fn();
            } catch (ex) {
                this.numFailures += 1;
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                this.lastFailure = ex;
                await this.backoffStrategy.backoff();
            }
        }
        throw this.lastFailure;
    }
}
