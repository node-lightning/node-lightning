import { PrivateKey } from "@node-lightning/bitcoin";

export type CreateBasePointsResult = {
    paymentBasePointSecret: PrivateKey;
    delayedPaymentBasePointSecret: PrivateKey;
    htlcBasePointSecret: PrivateKey;
    revocationBasePointSecret: PrivateKey;
    perCommitmentSeed: PrivateKey;
};
