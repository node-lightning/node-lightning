import { IPolicy } from "./policies/policy";

export interface IBitcoindOptions {
    rpcuser?: string;
    rpcpassword?: string;
    host: string;
    port: number;
    zmqpubrawtx?: string;
    zmqpubrawblock?: string;
    policyMaker?: <T>() => IPolicy<T>;
}
