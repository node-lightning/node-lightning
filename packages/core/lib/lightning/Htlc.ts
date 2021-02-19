import { Value } from "@node-lightning/bitcoin";
import { HtlcDirection } from "./HtlcDirection";

export class Htlc {
    constructor(
        readonly htlcId: bigint,
        readonly direction: HtlcDirection,
        readonly value: Value,
        readonly cltvExpiry: number,
        readonly paymentHash: Buffer,
    ) {}
}
