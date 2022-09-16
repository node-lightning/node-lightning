import { IPolicy } from "./policies/Policy";

export interface IBitcoindOptions {
    rpcuser?: string;
    rpcpassword?: string;
    rpcurl?: string;
    host?: string;
    port?: number | string;
    zmqpubrawtx?: string;
    zmqpubrawblock?: string;
    policyMaker?: <T>() => IPolicy<T>;
}
