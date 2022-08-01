import { IBackoffStrategy } from "./BackoffStrategy";
import { wait } from "./Wait";

export class ConstantBackoff implements IBackoffStrategy {
    constructor(
        readonly timeoutMs: number,
        readonly waitFn: (timeoutMs: number) => Promise<void> = wait,
    ) {}

    public async backoff(): Promise<void> {
        return await this.waitFn(this.timeoutMs);
    }
}
