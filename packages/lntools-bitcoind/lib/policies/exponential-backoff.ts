import { IBackoffStrategy } from "./backoff-strategy";
import { wait } from "./wait";

/**
 * Exponential backoff strategy that when supplied with a startMs value will
 * increment the timeout based on powers of the base. It uses the general
 * exponential function equation:
 *
 * ```
 * timeout = ab^x
 * ```
 */
export class ExponentialBackoff implements IBackoffStrategy {
    public timeout: number;
    public exp: number;

    constructor(
        readonly startMs: number,
        readonly base: number,
        readonly waitFn: (timeoutMs: number) => Promise<void> = wait,
    ) {
        this.exp = 0;
    }

    public async backoff(): Promise<void> {
        const timeout = this.startMs * Math.pow(this.base, this.exp);
        await this.waitFn(timeout);
        this.exp++;
    }
}
