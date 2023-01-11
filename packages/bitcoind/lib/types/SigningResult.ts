export type SigningResult = {
    hex: string;
    complete: boolean;
    errors: Array<{
        txid: string;
        vout: number;
        scriptSig: string;
        sequence: string;
        error: string;
    }>;
};
